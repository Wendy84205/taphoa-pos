CREATE TABLE `authChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`identifier` varchar(320) NOT NULL,
	`channel` enum('sms','email') NOT NULL,
	`purpose` enum('login_otp','reset_password') NOT NULL,
	`codeHash` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `authChallenges_id` PRIMARY KEY(`id`)
);
