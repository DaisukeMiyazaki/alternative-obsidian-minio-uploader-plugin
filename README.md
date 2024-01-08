# Alternative Obsidian Minio Uploader Plugin

## English | [日本語](./README-jp.md)

With this plugin, you can upload images, videos, audio, PDFs, and other files to Minio OSS instead of copying them locally within the vault. This allows to reduce the size of local disk usage and improve the efficiency of synchronization between multiple devices.

Using a service like tailscale, ngrok and others allow you to upload large or many media files to a machine with a large disk to host them. All you need from Obsidian UI is a reference URL Key, which corresponds with bucket name and its object name. This implementation primarily expects minIO as docker container hosted on a running machine at home.

## Features

- Supports dragging and dropping multiple files to the editor and directly uploading them to Minio
- Supports for selecting a bucket, parsed by minIO API call

## Setting

All Minio related configurations must be correctly configured beforehand:

>Tip: API data access port number for Minio

- accessKey
- secretKey
- bucket
- endpoint
- port
- SSL

MinIO needs to allow anonymous access to files in the Bucket settings from the console, which allows files to be directly accessed through URLs.

## Thanks

This project is inspired by [obsidian-minio-uploader-plugin](https://github.com/seebin/obsidian-minio-uploader-plugin).
