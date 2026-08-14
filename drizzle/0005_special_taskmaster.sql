CREATE TABLE `storeInvitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`identifier` varchar(320) NOT NULL,
	`kind` enum('email','phone') NOT NULL,
	`role` enum('staff') NOT NULL DEFAULT 'staff',
	`status` enum('pending','accepted','expired','revoked') NOT NULL DEFAULT 'pending',
	`tokenHash` text NOT NULL,
	`createdByUserId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storeInvitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `storeMembers` ADD `pinHash` text;--> statement-breakpoint
ALTER TABLE `storeMembers` ADD `pinFailedAttempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `storeMembers` ADD `pinLockedUntil` timestamp;--> statement-breakpoint
ALTER TABLE `stores` ADD `storeType` enum('solo','withStaff') DEFAULT 'solo' NOT NULL;