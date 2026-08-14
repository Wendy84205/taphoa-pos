CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` varchar(128),
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`snapshotJson` text NOT NULL,
	`updatedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `posSnapshots_storeId_unique` UNIQUE(`storeId`)
);
--> statement-breakpoint
CREATE TABLE `storeMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','staff') NOT NULL DEFAULT 'staff',
	`status` enum('active','invited','disabled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storeMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `store_members_store_user_unique` UNIQUE(`storeId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`ownerUserId` int NOT NULL,
	`subscriptionPlan` varchar(32) NOT NULL DEFAULT 'free',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`)
);
