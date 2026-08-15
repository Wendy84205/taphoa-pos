CREATE TABLE `billingWebhookEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('stripe','apple','google_play') NOT NULL,
	`providerEventId` varchar(255) NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`storeId` int,
	`payloadHash` varchar(64) NOT NULL,
	`processingStatus` enum('processed','ignored','failed') NOT NULL DEFAULT 'processed',
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billingWebhookEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `billing_webhook_provider_event_unique` UNIQUE(`provider`,`providerEventId`)
);
--> statement-breakpoint
CREATE TABLE `storeEntitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`planCode` varchar(64) NOT NULL DEFAULT 'trial',
	`status` enum('trialing','active','past_due','grace','canceled','expired','legacy') NOT NULL DEFAULT 'trialing',
	`source` enum('trial','stripe','apple','google_play','manual','legacy') NOT NULL DEFAULT 'trial',
	`trialStartedAt` timestamp,
	`trialEndsAt` timestamp,
	`currentPeriodEnd` timestamp,
	`graceEndsAt` timestamp,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storeEntitlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `store_entitlements_store_unique` UNIQUE(`storeId`),
	CONSTRAINT `store_entitlements_stripe_customer_unique` UNIQUE(`stripeCustomerId`),
	CONSTRAINT `store_entitlements_stripe_subscription_unique` UNIQUE(`stripeSubscriptionId`)
);
