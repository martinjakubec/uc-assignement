-- CreateTable
CREATE TABLE `CurrencyDayData` (
    `currency` VARCHAR(191) NOT NULL,
    `date` BIGINT NOT NULL,
    `data` JSON NOT NULL,

    PRIMARY KEY (`currency`, `date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
