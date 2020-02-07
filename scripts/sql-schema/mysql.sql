-- phpMyAdmin SQL Dump
-- version 4.8.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Erstellungszeit: 28. Sep 2018 um 15:13
-- Server-Version: 5.7.23-0ubuntu0.16.04.1
-- PHP-Version: 7.0.31-1+ubuntu16.04.1+deb.sury.org+1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `testcenter`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `admintokens`
--

CREATE TABLE `admintokens` (
  `id` varchar(50) COLLATE utf8_german2_ci NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `valid_until` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `bookletlogs`
--

CREATE TABLE `bookletlogs` (
  `booklet_id` bigint(20) UNSIGNED NOT NULL,
  `timestamp` bigint(20) NOT NULL DEFAULT '0',
  `logentry` text COLLATE utf8_german2_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `bookletreviews`
--

CREATE TABLE `bookletreviews` (
  `booklet_id` bigint(20) UNSIGNED NOT NULL,
  `reviewtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reviewer` varchar(50) COLLATE utf8_german2_ci NOT NULL,
  `priority` tinyint(1) NOT NULL DEFAULT '0',
  `categories` varchar(50) COLLATE utf8_german2_ci DEFAULT NULL,
  `entry` text COLLATE utf8_german2_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `booklets`
--

CREATE TABLE `booklets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(50) COLLATE utf8_german2_ci NOT NULL,
  `person_id` bigint(20) UNSIGNED NOT NULL,
  `laststate` text COLLATE utf8_german2_ci,
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  `label` varchar(100) COLLATE utf8_german2_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `logins`
--

CREATE TABLE `logins` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(50) COLLATE utf8_german2_ci NOT NULL,
  `mode` varchar(10) COLLATE utf8_german2_ci NOT NULL,
  `workspace_id` bigint(20) UNSIGNED NOT NULL,
  `valid_until` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `token` varchar(50) COLLATE utf8_german2_ci NOT NULL,
  `booklet_def` text COLLATE utf8_german2_ci,
  `groupname` varchar(100) COLLATE utf8_german2_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `persons`
--

CREATE TABLE `persons` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(50) COLLATE utf8_german2_ci NOT NULL,
  `login_id` bigint(20) UNSIGNED NOT NULL,
  `valid_until` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `token` varchar(50) COLLATE utf8_german2_ci NOT NULL,
  `laststate` text COLLATE utf8_german2_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `unitlogs`
--

CREATE TABLE `unitlogs` (
  `unit_id` bigint(20) UNSIGNED NOT NULL,
  `timestamp` bigint(20) NOT NULL DEFAULT '0',
  `logentry` text COLLATE utf8_german2_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `unitreviews`
--

CREATE TABLE `unitreviews` (
  `unit_id` bigint(20) UNSIGNED NOT NULL,
  `reviewtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reviewer` varchar(50) COLLATE utf8_german2_ci NOT NULL,
  `priority` tinyint(1) NOT NULL DEFAULT '0',
  `categories` varchar(50) COLLATE utf8_german2_ci DEFAULT NULL,
  `entry` text COLLATE utf8_german2_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `units`
--

CREATE TABLE `units` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(50) COLLATE utf8_german2_ci NOT NULL,
  `booklet_id` bigint(20) UNSIGNED NOT NULL,
  `laststate` text COLLATE utf8_german2_ci,
  `responses` text COLLATE utf8_german2_ci,
  `responsetype` varchar(50) COLLATE utf8_german2_ci DEFAULT NULL,
  `responses_ts` bigint(20) NOT NULL DEFAULT '0',
  `restorepoint` text COLLATE utf8_german2_ci,
  `restorepoint_ts` bigint(20) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(50) COLLATE utf8_german2_ci NOT NULL,
  `password` varchar(100) COLLATE utf8_german2_ci NOT NULL,
  `email` varchar(100) COLLATE utf8_german2_ci DEFAULT NULL,
  `is_superadmin` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `workspaces`
--

CREATE TABLE `workspaces` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(50) COLLATE utf8_german2_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `workspace_users`
--

CREATE TABLE `workspace_users` (
  `workspace_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role` varchar(10) COLLATE utf8_german2_ci NOT NULL DEFAULT 'RW'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `admintokens`
--
ALTER TABLE `admintokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_fk_users_admintokens` (`user_id`) USING BTREE;

--
-- Indizes für die Tabelle `bookletlogs`
--
ALTER TABLE `bookletlogs`
  ADD KEY `index_fk_log_booklet` (`booklet_id`) USING BTREE;

--
-- Indizes für die Tabelle `bookletreviews`
--
ALTER TABLE `bookletreviews`
  ADD KEY `index_fk_review_booklet` (`booklet_id`) USING BTREE;

--
-- Indizes für die Tabelle `booklets`
--
ALTER TABLE `booklets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_fk_booklet_person` (`person_id`) USING BTREE;

--
-- Indizes für die Tabelle `logins`
--
ALTER TABLE `logins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_fk_login_workspace` (`workspace_id`) USING BTREE;

--
-- Indizes für die Tabelle `persons`
--
ALTER TABLE `persons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_fk_person_login` (`login_id`) USING BTREE;

--
-- Indizes für die Tabelle `unitlogs`
--
ALTER TABLE `unitlogs`
  ADD KEY `index_fk_log_unit` (`unit_id`) USING BTREE;

--
-- Indizes für die Tabelle `unitreviews`
--
ALTER TABLE `unitreviews`
  ADD KEY `index_fk_review_unit` (`unit_id`) USING BTREE;

--
-- Indizes für die Tabelle `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_fk_unit_booklet` (`booklet_id`) USING BTREE;

--
-- Indizes für die Tabelle `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `workspaces`
--
ALTER TABLE `workspaces`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `workspace_users`
--
ALTER TABLE `workspace_users`
  ADD PRIMARY KEY (`workspace_id`,`user_id`),
  ADD KEY `index_fk_workspace_users_user` (`user_id`) USING BTREE,
  ADD KEY `index_fk_workspace_users_workspace` (`workspace_id`) USING BTREE;

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `booklets`
--
ALTER TABLE `booklets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `logins`
--
ALTER TABLE `logins`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `persons`
--
ALTER TABLE `persons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `units`
--
ALTER TABLE `units`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `workspaces`
--
ALTER TABLE `workspaces`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `admintokens`
--
ALTER TABLE `admintokens`
  ADD CONSTRAINT `fk_users_admintokens` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints der Tabelle `bookletlogs`
--
ALTER TABLE `bookletlogs`
  ADD CONSTRAINT `fk_log_booklet` FOREIGN KEY (`booklet_id`) REFERENCES `booklets` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints der Tabelle `bookletreviews`
--
ALTER TABLE `bookletreviews`
  ADD CONSTRAINT `fk_review_booklet` FOREIGN KEY (`booklet_id`) REFERENCES `booklets` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints der Tabelle `booklets`
--
ALTER TABLE `booklets`
  ADD CONSTRAINT `fk_booklet_person` FOREIGN KEY (`person_id`) REFERENCES `persons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints der Tabelle `logins`
--
ALTER TABLE `logins`
  ADD CONSTRAINT `fk_login_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints der Tabelle `persons`
--
ALTER TABLE `persons`
  ADD CONSTRAINT `fk_person_login` FOREIGN KEY (`login_id`) REFERENCES `logins` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints der Tabelle `unitlogs`
--
ALTER TABLE `unitlogs`
  ADD CONSTRAINT `fk_log_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints der Tabelle `unitreviews`
--
ALTER TABLE `unitreviews`
  ADD CONSTRAINT `fk_review_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints der Tabelle `units`
--
ALTER TABLE `units`
  ADD CONSTRAINT `fk_unit_booklet` FOREIGN KEY (`booklet_id`) REFERENCES `booklets` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints der Tabelle `workspace_users`
--
ALTER TABLE `workspace_users`
  ADD CONSTRAINT `fk_workspace_users_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_workspace_users_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;