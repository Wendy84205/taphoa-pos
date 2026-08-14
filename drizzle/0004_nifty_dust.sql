CREATE TABLE `snapshotBackups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`sourceVersion` int NOT NULL,
	`snapshotJson` text NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `snapshotBackups_id` PRIMARY KEY(`id`)
);
