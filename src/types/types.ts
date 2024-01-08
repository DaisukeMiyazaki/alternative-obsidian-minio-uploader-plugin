export interface MinioPluginSettings {
	accessKey: string;
	secretKey: string;
	region: string;
	bucket: string;
	endpoint: string;
	port: number;
	isUseSSL: boolean;
	isImgPreview: boolean;
	isVideoPreview: boolean;
	isAudioPreview: boolean;
	docsPreview: string;
	nameRule: string;
	pathRule: string;
}

export const DEFAULT_SETTINGS: MinioPluginSettings = {
	accessKey: "",
	secretKey: "",
	region: "",
	endpoint: "",
	port: 443,
	bucket: "",
	isUseSSL: true,
	isImgPreview: true,
	isVideoPreview: true,
	isAudioPreview: true,
	docsPreview: "",
	nameRule: "local",
	pathRule: "root",
};
