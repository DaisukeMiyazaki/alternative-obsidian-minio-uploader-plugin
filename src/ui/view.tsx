import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import * as Minio from "minio";
import { MinioPluginSettings } from "../types/types";
import MinioUploaderPlugin from "../main";

export const VIEW_TYPE = "minio-uploader";

export class minioUploaderView extends ItemView {
	settings: MinioPluginSettings;
	selectedBucket: string;
	plugin: MinioUploaderPlugin;
	constructor(
		leaf: WorkspaceLeaf,
		settings: MinioPluginSettings,
		plugin: MinioUploaderPlugin,
	) {
		super(leaf);
		this.settings = settings;
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getIcon(): string {
		return "hard-drive-upload";
	}

	getDisplayText() {
		return "MinIO Uploader";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h4", { text: "Select Your Bucket To Upload" });
		try {
			new Notice(this.settings.endpoint);
			const minioClient = new Minio.Client({
				endPoint: this.settings.endpoint,
				port: this.settings.port,
				accessKey: this.settings.accessKey,
				secretKey: this.settings.secretKey,
				useSSL: this.settings.isUseSSL,
			});

			const { contentEl } = this;
			const selectEl = contentEl.createEl("select");
			// set a onclick listener to the select element
			selectEl.addEventListener("change", (event) => {
				this.selectedBucket = (event.target as HTMLSelectElement).value;
				(async () => {
					this.settings.bucket = this.selectedBucket;
					await this.plugin.saveSettings();
					new Notice(
						"Your bucket has been set to " + this.selectedBucket,
					);
				})();
			});

			// fetch a bucket from endpoints, and let user select one
			const buckets = await minioClient.listBuckets();
			buckets.forEach((bucket) => {
				const optionEl = createEl("option", {
					value: bucket.name,
					text: bucket.name,
				});
				selectEl.appendChild(optionEl);
			});
		} catch (error) {
			new Notice("Error: upload failed." + error);
		}
	}

	async onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
