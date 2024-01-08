import {
	Editor,
	EditorPosition,
	Notice,
	Plugin,
	WorkspaceLeaf,
} from "obsidian";
import { moment } from "obsidian";
import mime from "mime";
import { t } from "./i18n";

import * as Minio from "minio";

import { minioUploaderView, VIEW_TYPE } from "./ui/view";
import { DEFAULT_SETTINGS, MinioPluginSettings } from "./types/types";
import MinioSettingTab from "./settings";

export default class MinioUploaderPlugin extends Plugin {
	settings: MinioPluginSettings;

	async onload() {
		await this.loadSettings();
		this.init();
	}

	private init() {
		// Mounts UI
		this.registerView(
			VIEW_TYPE,
			(leaf) => new minioUploaderView(leaf, this.settings, this),
		);

		this.addRibbonIcon("hard-drive-upload", "minIO Uploader", () => {
			this.activateView();
		});

		const item = this.addStatusBarItem();
		item.createEl("span", { text: this.settings.bucket, cls: "bucket" });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MinioSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on(
				"editor-paste",
				this.handleUploader.bind(this),
			),
		);
		this.registerEvent(
			this.app.workspace.on(
				"editor-drop",
				this.handleUploader.bind(this),
			),
		);
	}

	async activateView() {
		// run when the ribbon icon is clicked
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}

	onunload() {}

	private getFileType(file: File): string {
		/* ファイルのタイプを返す */
		const imageType = /image.*/;
		const videoType = /video.*/;
		const audioType = /audio.*/;
		const docType = /application\/(vnd.*|pdf)/;

		if (file?.type.match(videoType)) {
			return "video";
		} else if (file?.type.match(audioType)) {
			return "audio";
		} else if (file?.type.match(docType)) {
			return "doc";
		} else if (file?.type.match(imageType)) {
			return "image";
		} else {
			return "";
		}
	}

	private async handleUploader(
		evt: ClipboardEvent | DragEvent,
		editor: Editor,
	): Promise<void> {
		if (evt.defaultPrevented) {
			return;
		}
		let files: FileList | undefined = undefined;

		switch (evt.type) {
			case "paste":
				files = (evt as ClipboardEvent).clipboardData?.files;
				break;
			case "drop":
				files = (evt as DragEvent).dataTransfer?.files;
		}
		if (!files) return;

		for (const file of Array.from(files)) {
			if (!file || (file && !this.getFileType(file))) continue;

			evt.preventDefault();
			const { endpoint, port, bucket } = this.settings;
			const host = `http://${endpoint}${":" + port}`;
			let replaceText = `[${t("Uploading")}：0%](${file.name})\n`;
			editor.replaceSelection(replaceText);

			const objectName = await this.minioUploader(file, (process) => {
				new Notice("Uploading：" + process + "%");
				const _t = `[${t("Uploading")}：${process}%](${file?.name})`;
				this.replaceText(editor, replaceText, _t);
				replaceText = _t;
			});
			const url = `${host}/${bucket}/${objectName}`;
			this.replaceText(
				editor,
				replaceText,
				this.wrapFileDependingOnType(
					this.getFileType(file),
					url,
					file.name,
				),
			);
		}
	}

	private getObjectName(file: File): string {
		let objectName = "";
		switch (this.settings.pathRule) {
			case "root":
				objectName = "";
				break;
			case "type":
				objectName = `${this.getFileType(file)}/`;
				break;
			case "date":
				objectName = `${moment().format("YYYY/MM/DD")}/`;
				break;
			case "typeAndData":
				objectName = `${this.getFileType(file)}/${moment().format(
					"YYYY/MM/DD",
				)}/`;
				break;
			default:
		}
		switch (this.settings.nameRule) {
			case "local":
				objectName += file.name;
				break;
			case "time":
				objectName +=
					moment().format("YYYYMMDDHHmmSS") +
					file.name.substring(file.name.lastIndexOf("."));
				break;
			case "timeAndLocal":
				objectName +=
					moment().format("YYYYMMDDHHmmSS") + "_" + file.name;
				break;
			default:
		}
		return objectName;
	}

	private replaceText(
		editor: Editor,
		target: string,
		replacement: string,
	): void {
		target = target.trim();
		const lines = editor.getValue().split("\n");
		for (let i = 0; i < lines.length; i++) {
			const ch = lines[i].indexOf(target);
			if (ch !== -1) {
				const from = { line: i, ch: ch } as EditorPosition;
				const to = {
					line: i,
					ch: ch + target.length,
				} as EditorPosition;
				editor.setCursor(from);
				editor.replaceRange(replacement, from, to);
				to.ch = ch + replacement.length;
				editor.setCursor(to);
				break;
			}
		}
	}

	private wrapFileDependingOnType(
		type: string,
		url: string,
		name: string,
	): string {
		if (type === "image") {
			return `${
				this.settings.isImgPreview ? "!" : ""
			}[${name}](${url})\n`;
		} else if (type === "video") {
			return `${
				this.settings.isVideoPreview
					? `<video src="${url}" controls></video>`
					: `[${name}](${url})`
			}\n`;
		} else if (type === "audio") {
			return `${
				this.settings.isAudioPreview
					? `<audio src="${url}" controls></audio>`
					: `[${name}](${url})`
			}\n`;
		} else if (type === "doc") {
			return `\n${
				this.settings.docsPreview
					? `<iframe frameborder=0 border=0 width=100% height=800
			src="${this.settings.docsPreview}${url}">
		</iframe>`
					: `[${name}](${url})`
			}\n`;
		} else {
			throw new Error("Unknown file type");
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private minioUploader(
		file: File,
		progress?: (count: number) => void,
	): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				const minioClient = new Minio.Client({
					endPoint: this.settings.endpoint,
					port: this.settings.port,
					accessKey: this.settings.accessKey,
					secretKey: this.settings.secretKey,
					useSSL: this.settings.isUseSSL,
				});
				const objectName = this.getObjectName(file);
				new Notice("uploading to : " + this.settings.bucket);
				new Notice(objectName);
				minioClient
					.presignedPutObject(
						this.settings.bucket,
						objectName,
						1 * 60 * 60,
					)
					.then((presignedUrl) => {
						const xhr = new XMLHttpRequest();
						xhr.upload.addEventListener(
							"progress",
							(progressEvent) => {
								if (progress)
									progress(
										Math.round(
											(progressEvent.loaded /
												progressEvent.total) *
												100,
										),
									);
							},
							false,
						);
						xhr.onreadystatechange = function () {
							if (xhr.readyState === 4) {
								if (xhr.status === 200) {
									resolve(objectName);
								} else {
									console.error("xhr", xhr);
									reject(xhr.status);
									new Notice(
										"Error: upload failed." + xhr.status,
									);
								}
							}
						};
						xhr.open("PUT", presignedUrl, true);
						const va = mime.getType(
							objectName.substring(objectName.lastIndexOf(".")),
						) as string;
						xhr.setRequestHeader("Content-Type", va);

						xhr.send(file);
					})
					.catch((err) => {
						console.error("presignedUrl", err);
						reject(err);
						new Notice("Error: upload failed." + err);
					});
			} catch (error) {
				new Notice("Error: upload failed." + error);
				reject(error);
			}
		});
	}
}
