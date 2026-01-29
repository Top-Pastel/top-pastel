CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerPhone` varchar(20) NOT NULL,
	`deliveryAddress` text NOT NULL,
	`deliveryPostalCode` varchar(10) NOT NULL,
	`deliveryCity` varchar(100) NOT NULL,
	`deliveryType` enum('ponto_ctt','domicilio') NOT NULL,
	`shippingCost` decimal(10,2) NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`stripePaymentId` varchar(255),
	`paymentStatus` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`orderStatus` enum('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`cttShippingNumber` varchar(50),
	`cttTrackingUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipmentTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`cttShippingNumber` varchar(50) NOT NULL,
	`status` varchar(50) NOT NULL,
	`lastUpdate` timestamp NOT NULL DEFAULT (now()),
	`trackingData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipmentTracking_id` PRIMARY KEY(`id`)
);
