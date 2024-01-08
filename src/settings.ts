import {
	App,
	PluginSettingTab,
	Setting,
	TextComponent,
	setIcon,
} from "obsidian";
import { t } from "./i18n";
import MinioUploaderPlugin from "./main";

const wrapTextWithPasswordHide = (text: TextComponent) => {
	const hider = text.inputEl.insertAdjacentElement(
		"beforebegin",
		createSpan(),
	);
	if (!hider) {
		return;
	}
	setIcon(hider as HTMLElement, "eye-off");

	hider.addEventListener("click", () => {
		const isText = text.inputEl.getAttribute("type") === "text";
		if (isText) {
			setIcon(hider as HTMLElement, "eye-off");
			text.inputEl.setAttribute("type", "password");
		} else {
			setIcon(hider as HTMLElement, "eye");
			text.inputEl.setAttribute("type", "text");
		}
		text.inputEl.focus();
	});
	text.inputEl.setAttribute("type", "password");
	return text;
};

export default class MinioSettingTab extends PluginSettingTab {
	plugin: MinioUploaderPlugin;

	constructor(app: App, plugin: MinioUploaderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Access key")
			.setDesc(t("Required"))
			.addText((text) => {
				wrapTextWithPasswordHide(text);
				text.setPlaceholder(t("Enter your access key"))
					.setValue(this.plugin.settings.accessKey)
					.onChange(async (value) => {
						this.plugin.settings.accessKey = value;
						await this.plugin.saveSettings();
					});
			});
		new Setting(containerEl)
			.setName("Secret key")
			.setDesc(t("Required"))
			.addText((text) => {
				wrapTextWithPasswordHide(text);
				text.setPlaceholder(t("Enter your secret key"))
					.setValue(this.plugin.settings.secretKey)
					.onChange(async (value) => {
						this.plugin.settings.secretKey = value;
						await this.plugin.saveSettings();
					});
			});
		new Setting(containerEl)
			.setName("Region")
			.setDesc(t("Optional"))
			.addText((text) =>
				text
					.setPlaceholder(t("Enter your region"))
					.setValue(this.plugin.settings.region)
					.onChange(async (value) => {
						this.plugin.settings.region = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName("Bucket")
			.setDesc(t("Required"))
			.addText((text) =>
				text
					.setPlaceholder(t("Enter your bucket"))
					.setValue(this.plugin.settings.bucket)
					.onChange(async (value) => {
						this.plugin.settings.bucket = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName("Endpoint")
			.setDesc(t("Required"))
			.addText((text) =>
				text
					.setPlaceholder("minio.xxxx.cn")
					.setValue(this.plugin.settings.endpoint)
					.onChange(async (value) => {
						this.plugin.settings.endpoint = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName("Port")
			.setDesc(t("Required"))
			.addText((text) =>
				text
					.setPlaceholder(t("Enter your port"))
					.setValue(this.plugin.settings.port + "")
					.onChange(async (value) => {
						this.plugin.settings.port = parseInt(value);
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl).setName("SSL").addToggle((text) =>
			text
				.setValue(this.plugin.settings.isUseSSL)
				.onChange(async (value) => {
					this.plugin.settings.isUseSSL = value;
					await this.plugin.saveSettings();
				}),
		);
		containerEl.createEl("h3", { text: t("Object rules") });
		containerEl.createEl("br");
		new Setting(containerEl)
			.setName(t("Object naming rules"))
			.setDesc(t("Naming rules description"))
			.addDropdown((select) =>
				select
					.addOption("local", t("Local file name"))
					.addOption("time", t("Time file name"))
					.addOption("timeAndLocal", t("Time and local file name"))
					.setValue(this.plugin.settings.nameRule)
					.onChange(async (value) => {
						this.plugin.settings.nameRule = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName(t("Object path rules"))
			.setDesc(t("Object path rules description"))
			.addDropdown((select) =>
				select
					.addOption("root", t("Root directory"))
					.addOption("type", t("File type directory"))
					.addOption("date", t("Date directory"))
					.addOption("typeAndData", t("File type and date directory"))
					.setValue(this.plugin.settings.pathRule)
					.onChange(async (value) => {
						this.plugin.settings.pathRule = value;
						await this.plugin.saveSettings();
					}),
			);

		containerEl.createEl("h3", { text: t("Preview") });
		containerEl.createEl("br");
		new Setting(containerEl)
			.setName(t("Image preview"))
			.setDesc(t("Image preview description"))
			.addToggle((text) =>
				text
					.setValue(this.plugin.settings.isImgPreview)
					.onChange(async (value) => {
						this.plugin.settings.isImgPreview = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName(t("Video preview"))
			.setDesc(t("Video preview description"))
			.addToggle((text) =>
				text
					.setValue(this.plugin.settings.isVideoPreview)
					.onChange(async (value) => {
						this.plugin.settings.isVideoPreview = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName(t("Audio preview"))
			.setDesc(t("Audio preview description"))
			.addToggle((text) =>
				text
					.setValue(this.plugin.settings.isAudioPreview)
					.onChange(async (value) => {
						this.plugin.settings.isAudioPreview = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName(t("Docs preview"))
			.setDesc(t("Docs preview description"))
			.addDropdown((select) =>
				select
					.addOption("", t("Disabled"))
					.addOption(
						"https://docs.google.com/viewer?url=",
						t("Google docs"),
					)
					.addOption(
						"https://view.officeapps.live.com/op/view.aspx?src=",
						t("Office online"),
					)
					.setValue(this.plugin.settings.docsPreview)
					.onChange(async (value) => {
						this.plugin.settings.docsPreview = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
