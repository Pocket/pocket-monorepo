USE `readitla_ril-tmp`;

SET @user_id = 24060899;
SET @other_user_id = 24060900;
SET @premium_user_id = 24060901;
SET @old_premium_user_id = 24060902;
SET @fx_user_id = 24060903;


REPLACE INTO `api_keys` (`api_id`, `consumer_key`, `name`, `description`, `app_url`, `platform_id`, `slug`, `permission`, `is_native`, `allow_migrate`, `status`, `time_created`, `time_updated`)
VALUES
  (1,'1-50fc51878fb28443abddef74','Pocket for Firefox','The official Pocket extension for Firefox','https://addons.mozilla.org/en-US/firefox/addon/read-it-later/',6,'6f609e1feb77daa','amd',1,1,1,'2012-08-14 15:22:10','2012-08-14 15:22:10'),
  (5511,'5511-2b6e21f91426b40bb907854c','Pocket for iPad','Official Pocket application for iPad','',2,'14b2f13a5bffc89','amd',1,1,1,'2012-08-14 15:22:10','2012-08-14 15:22:10'),
  (5512,'5512-ed03e9997ac783070c2efdc8','Pocket for iPhone','Official Pocket application for iPhone','http://itunes.apple.com/us/app/read-it-later-pro/id309601447?mt=8',1,'1f50fa7ef08f080','amd',1,1,1,'2012-08-14 15:22:10','2012-08-14 15:22:10'),
  (5513,'5513-8646141fb5902c766272e74d','Pocket for Android','Official Pocket application for Android','https://play.google.com/store/apps/details?id=com.ideashower.readitlater.pro',4,'35bd9f6c4b8bf4f','amd',1,1,1,'2012-08-14 15:22:10','2012-08-14 15:22:10'),
  (5514,'5514-ca6ec859d6ca2f9eb15961bb','Pocket for Android Tablet','The official Pocket app for Android Tablet','market://details?id=com.ideashower.readitlater.pro',5,'f41625b487c3d77','amd',1,1,1,'2012-08-14 15:22:10','2012-08-14 15:22:10'),
  (5515,'5515-0968af5ecbd93512d966b338','Pocket for Android (Amazon App Store)','Official Pocket application for Android in the Amazon App Store','http://www.amazon.com/gp/mas/dl/android?p=com.ideashower.readitlater.pro',4,'1416bf856dc8220','amd',1,1,1,'2012-08-14 15:22:10','2012-08-14 15:22:10'),
  (5516,'5516-245d8e9eb0168b6503a17ec9','Pocket for Android Tablet (Amazon App Store)','Official Pocket application for Android Tablet in the Amazon App Store','',5,'5f69b414c385a9a','amd',1,1,1,'2012-08-14 15:22:10','2012-08-14 15:22:10'),
  (7035,'7035-d3382df43fe0195174c42f9c','Pocket for Google Chrome','The official Pocket extension for Google Chrome','https://chrome.google.com/webstore/detail/niloccemoadcdkdjlinkgdfekeahmflj',6,'53c80af5e634f5b','amd',2,1,1,'2012-08-14 15:22:10','2012-08-14 15:22:10'),
  (8775,'8775-462684aaf45d92e97065a0f0','Pocket for Mac','The official Pocket app for the Mac','',3,'54e151e88431789','amd',1,1,1,'2012-08-14 15:22:10','2012-08-14 15:22:10'),
  (9346,'9346-1e342af73fe11d5174042e9d','Pocket for Safari','The official Pocket extension for Safari','http://pocket-extensions.s3.amazonaws.com/safari/Pocket.safariextz',6,'48a4dbe9a60e3b2','amd',2,1,1,'2012-08-14 15:22:10','2012-08-14 15:22:10'),
  (10450,'10450-70f1b6b80c2f04886c5e666c','Pocket for Pocket','Pocketception',NULL,1,'e40763f02d28435','a',0,0,1,'2012-11-06 18:03:13','2012-11-06 18:03:13'),
  (10587,'10587-f5271eeb37c9231392c71bf0','Pocket for Windows 8','Pocket client for Windows 8',NULL,10,'2d3a991b386e911','amd',0,0,1,'2012-11-10 08:47:25','2012-11-10 08:47:25'),
  (10622,'10622-2f079e49ada3217fe173fa53','Pocket for Linux','Linux desktop application',NULL,11,'0afc0558b85fe7e','md',0,0,1,'2012-11-11 16:08:44','2012-11-11 16:08:44'),
  (11055,'11055-ab600c3f1b3766a5dc607bc9','Pocket for mikutter','ておておー',NULL,11,'a8fd34e774ad88f','a',0,0,1,'2012-12-10 03:39:47','2012-12-10 03:39:47'),
  (11082,'11082-21f9842236b3b2e3cbb8220a','Pocket for Vimperator','Pocket Vimperator Plugin',NULL,9,'0235116c04bf1b8','amd',0,0,1,'2012-12-12 00:48:26','2012-12-12 00:48:26'),
  (11179,'11179-7a5e31cce24ea7e27fc1bd62','Pocket for Blackberry','The famous \'Pocket\' is now available for Blackberry',NULL,10,'a7232889fd63194','amd',0,0,0,'2012-12-20 18:40:48','2012-12-20 18:40:48'),
  (11535,'11535-fbced7d7e3ed242dfd9e4f9e','Pocket For Windows 8','Read articles later on Windows 8',NULL,10,'340d3938ca5e2f3','amd',0,0,1,'2013-01-16 11:20:32','2013-01-16 11:20:32'),
  (11644,'11644-125086fece62cd72f6cc6d8c','Pocket for Calibre','Allows Calibre to pull Pocket articles',NULL,8,'7d0a300f47f53f2','d',0,0,0,'2013-01-22 15:28:30','2013-01-22 15:28:30'),
  (11740,'11740-b12870539260c8a8b9719676','Pocket for Windows Phone 7','Save your links for later and mange your saved links.',NULL,7,'301d9dbfd62d560','amd',0,0,1,'2013-01-28 20:16:22','2013-01-28 20:16:22'),
  (11816,'11816-e49d14476336cf38c648748a','Pocket for Windows Phone 8','Save your links for later and mange your saved links.',NULL,7,'1ef5ce1f3bdc4db','amd',0,0,1,'2013-02-03 17:06:37','2013-02-03 17:06:37'),
  (12269,'12269-7ccc1bd058f1ba8291aa8fc6','Pocket for WP8','This app is a pocket client for Windows PHone 8',NULL,7,'cb268e3e71c2142','amd',0,0,0,'2013-03-06 02:13:42','2013-03-06 02:13:42'),
  (12319,'12319-cc187c9a18e47434cbfc14c7','Pocket for Windows','A Pocket client for Windows',NULL,8,'e20e0ba80e8ff90','amd',0,0,1,'2013-03-09 21:56:30','2013-03-09 21:56:30'),
  (12802,'12802-5975605da10ed3e2e8673f79','Pocket for Kindle','(Private) Application that makes Pocket accessible for the Kindle Paperwhite','http://kindlepocket.schmkr.nl',10,'f80a869411beaf3','md',0,0,1,'2013-03-31 15:21:23','2013-03-31 15:21:23'),
  (12856,'12856-e7368e4763299b3fdcc5e8c5','Pocket for Chrome Packaged App','Chrome Packaged App for Pocket',NULL,6,'0e22d651ab24a1b','amd',2,1,1,'2013-04-03 01:41:45','2013-04-03 01:41:45'),
  (13072,'13072-46b4643c1d8dddbab1657de3','Pocket For Maxthon','Pocket extension for Maxthon users. Single click to save current page to your pocket.',NULL,8,'0c8e0351bcea09c','amd',0,0,0,'2013-04-11 01:32:23','2013-04-11 01:32:23'),
  (13125,'13125-e508f73b0ca17f519e700489','Pocket for WP','Pocket for Windows phone',NULL,7,'034fed1e9dd150f','amd',0,0,1,'2013-04-13 09:57:18','2013-04-13 09:57:18'),
  (13636,'13636-c4206465337b34d00139154b','Pocket for XBMC','This addon lets you play video items in your Pocket account',NULL,6,'75b2b7957eea231','d',0,0,1,'2013-04-27 17:02:56','2013-04-27 17:02:56'),
  (14265,'14265-a4bbd6e0b26fb403a5cf7da0','Pocket for Windows 8','Pocket Reader App for Windows 8',NULL,7,'f8c3abcf2b1248c','amd',0,0,1,'2013-05-12 09:28:24','2013-05-12 09:28:24'),
  (14265,'14265-02c55558474ab75f416a0456','Pocket for Windows 8','Pocket Reader App for Windows 8',NULL,8,'ad4a2c9a93acf91','amd',0,0,1,'2013-05-12 09:28:24','2013-05-12 09:28:24'),
  (15449,'15449-d65f5fdc5cbb3fef26248f12','Pocket for Opera','Official Pocket extension for Opera',NULL,6,'592c7f2e8933d66','amd',2,1,1,'2013-06-14 22:26:36','2013-06-14 22:26:36'),
  (15555,'15555-30294ec343a28cf876d59c7f','Pocket For Windows Phone','Pocket Client For Windows Phone',NULL,7,'12375358a48ac64','amd',0,0,1,'2013-06-18 05:32:02','2013-06-18 05:32:02'),
  (16229,'16229-8f46f5238ec7b07e2c0f2fcf','Pocket for Windows 8','This is the official Pocket client for Windows 8.',NULL,8,'e949b335c69adeb','amd',2,1,1,'2013-07-07 21:28:21','2013-07-07 21:28:21'),
  (16488,'16488-964abd99d185e3508ccfadb8','Pocket for Weixin','This is a web plugin designed for Weixin.',NULL,1,'4d65a673672612f','amd',0,0,1,'2013-07-15 02:38:02','2013-07-15 02:38:02'),
  (16488,'16488-a21c5c7228cacb29a3670de3','Pocket for Weixin','This is a web plugin designed for Weixin.',NULL,2,'209420ceebb48a0','amd',0,0,1,'2013-07-15 02:38:02','2013-07-15 02:38:02'),
  (16488,'16488-437244d7784541874cdeaa20','Pocket for Weixin','This is a web plugin designed for Weixin.',NULL,3,'4552be972473c6f','amd',0,0,1,'2013-07-15 02:38:02','2013-07-15 02:38:02'),
  (16488,'16488-534de9a8211fdd39a44a7126','Pocket for Weixin','This is a web plugin designed for Weixin.',NULL,4,'651eecbffb2fda8','amd',0,0,1,'2013-07-15 02:38:02','2013-07-15 02:38:02'),
  (16488,'16488-3b68de2ff6b14ca092ca4f55','Pocket for Weixin','This is a web plugin designed for Weixin.',NULL,5,'7a3b216970bc3c1','amd',0,0,1,'2013-07-15 02:38:02','2013-07-15 02:38:02'),
  (16488,'16488-f0c8c33ef7d7633bac2f1578','Pocket for Weixin','This is a web plugin designed for Weixin.',NULL,6,'8563b7556d689f8','amd',0,0,1,'2013-07-15 02:38:02','2013-07-15 02:38:02'),
  (16488,'16488-c29515fdfeba08a29b097b90','Pocket for Weixin','This is a web plugin designed for Weixin.',NULL,7,'114aaa461a59a7d','amd',0,0,1,'2013-07-15 02:38:02','2013-07-15 02:38:02'),
  (16488,'16488-85f59a6079decfd8a76ebfd9','Pocket for Weixin','This is a web plugin designed for Weixin.',NULL,8,'4aba4310cf2e046','amd',0,0,1,'2013-07-15 02:38:02','2013-07-15 02:38:02'),
  (16488,'16488-ec8ae4eb8a419dee9adcbdcb','Pocket for Weixin','This is a web plugin designed for Weixin.',NULL,9,'d2943625e0930ff','amd',0,0,1,'2013-07-15 02:38:02','2013-07-15 02:38:02'),
  (16488,'16488-2980fc7f88996f0e65cbd8c0','Pocket for Weixin','This is a web plugin designed for Weixin.',NULL,10,'0e11de19e139f27','amd',0,0,1,'2013-07-15 02:38:02','2013-07-15 02:38:02'),
  (16488,'16488-7cd2e2e83f246d3c01ef6f6c','Pocket for Weixin','This is a web plugin designed for Weixin.',NULL,11,'741213e920979b7','amd',0,0,1,'2013-07-15 02:38:02','2013-07-15 02:38:02'),
  (17187,'17187-08d7f58987083048cbfd2f0e','Pocket for Windows 8','Desktop app for windows 8',NULL,8,'cf30542c9177770','amd',0,0,1,'2013-08-05 02:03:41','2013-08-05 02:03:41'),
  (17187,'17187-cbee66413f6a9f6ddd15a418','Pocket for Windows 8','Desktop app for windows 8',NULL,9,'345ffe2fcb453f9','amd',0,0,1,'2013-08-05 02:03:41','2013-08-05 02:03:41'),
  (17187,'17187-766a24a2ed2cf7f1818d2baf','Pocket for Windows 8','Desktop app for windows 8',NULL,11,'42d85bebfd81ed6','amd',0,0,1,'2013-08-05 02:03:41','2013-08-05 02:03:41'),
  (17620,'17620-56dab29b5c9eb73f8a1bca41','Pocket For Windows','Pocket app for Windows',NULL,8,'3cd4d3996b6c502','amd',0,0,1,'2013-08-19 16:46:42','2013-08-19 16:46:42'),
  (19120,'19120-c0cc15c5e13b22fa17fb3fd2','Pocket for Tizen OS','A Pocket client for Tizen OS',NULL,10,'1920caeca2004b2','amd',0,0,1,'2013-10-06 08:16:26','2013-10-06 08:16:26'),
  (19475,'19475-19a9b0c882a7293fd534f8ad','Pocket for Ubuntu','Pocket client for Ubuntu Touch and Desktop',NULL,10,'a7eacc35862cb67','amd',0,0,1,'2013-10-17 16:55:40','2013-10-17 16:55:40'),
  (19475,'19475-8f09db4c8ccfc0066d41f6e2','Pocket for Ubuntu','Pocket client for Ubuntu Touch and Desktop',NULL,11,'e3cba5318a02722','amd',0,0,1,'2013-10-17 16:55:40','2013-10-17 16:55:40'),
  (20011,'20011-1b41e6970b9d3c1a445c4683','Pocket for Ubuntu','Pocket Client for Ubuntu',NULL,11,'83169bd262272ee','amd',0,0,1,'2013-11-04 01:55:55','2013-11-04 01:55:55'),
  (20292,'20292-56185697167e3d2fbaeb97c4','Pocket for Excellentter','Pocket for twitter client on Microsoft Excel(R)',NULL,8,'ce18ac70712ceb5','amd',0,0,1,'2013-11-11 21:28:04','2013-11-11 21:28:04'),
  (21411,'21411-e05f2c2cd2de3fdeab5781e6','Pocket for nook','Just an app to see your list in your rooted nook',NULL,4,'a5fcf995b5d8003','amd',0,0,1,'2013-12-12 09:59:03','2013-12-12 09:59:03'),
  (22311,'22311-df1c3efb875a10331810a516','Pocket for CloudMagic','Save links to Pocket directly from CloudMagic Mail',NULL,1,'be2bb674b6646ce','am',0,0,0,'2014-01-09 05:26:05','2014-01-09 05:26:05'),
  (22311,'22311-47170b54a5c5d5266dc2fab6','Pocket for CloudMagic','Save links to Pocket directly from CloudMagic Mail',NULL,2,'5994552dcba68f6','am',0,0,0,'2014-01-09 05:26:05','2014-01-09 05:26:05'),
  (22311,'22311-40633cd9fdd29214b6bcc541','Pocket for CloudMagic','Save links to Pocket directly from CloudMagic Mail',NULL,4,'cd6a494b396139f','am',0,0,0,'2014-01-09 05:26:05','2014-01-09 05:26:05'),
  (22311,'22311-3d73dd9169410b6371f825c4','Pocket for CloudMagic','Save links to Pocket directly from CloudMagic Mail',NULL,5,'3cb3d08a217e950','am',0,0,0,'2014-01-09 05:26:05','2014-01-09 05:26:05'),
  (22311,'22311-a09de0b2583e0d938af98b22','Pocket for CloudMagic','Save links to Pocket directly from CloudMagic Mail',NULL,9,'3792f25f0090078','am',0,0,0,'2014-01-09 05:26:05','2014-01-09 05:26:05'),
  (22816,'22816-9eaf1a9b7602f3ec259946a1','Pocket for Emacs','Pocket extension for GNU Emacs',NULL,11,'850a530fba0063b','amd',0,0,1,'2014-01-21 15:59:55','2014-01-21 15:59:55'),
  (22931,'22931-4b89eb5d511677b8f1cbf6e5','Pocket for Firefox','Pocket for Firefox using the Mark API',NULL,6,'dc5b6d102bc06d4','am',0,1,1,'2014-01-23 11:59:31','2014-01-23 11:59:31'),
  (23192,'23192-8b0cbe26fb83c8c00eee3090','Pocket for CloudMagic','When you find a link in a mail you want to view later, put it in Pocket.',NULL,1,'2393baca93fb47b','amd',0,0,1,'2014-01-28 08:12:43','2014-01-28 08:12:43'),
  (23192,'23192-bd6d50e4b0cd896a377fee02','Pocket for CloudMagic','When you find a link in a mail you want to view later, put it in Pocket.',NULL,2,'00433bf58ec00fa','amd',0,0,1,'2014-01-28 08:12:43','2014-01-28 08:12:43'),
  (23192,'23192-3c1dfc9ecbc435dc7225af9f','Pocket for CloudMagic','When you find a link in a mail you want to view later, put it in Pocket.',NULL,3,'4c311172188b60d','amd',0,0,1,'2014-01-28 08:12:43','2014-01-28 08:12:43'),
  (23192,'23192-9641236ac5a02eb28ba4f635','Pocket for CloudMagic','When you find a link in a mail you want to view later, put it in Pocket.',NULL,4,'9c0d746c5655d79','amd',0,0,1,'2014-01-28 08:12:43','2014-01-28 08:12:43'),
  (23192,'23192-4e8aba0cd858ac0767930a8b','Pocket for CloudMagic','When you find a link in a mail you want to view later, put it in Pocket.',NULL,5,'4136f59963ee60c','amd',0,0,1,'2014-01-28 08:12:43','2014-01-28 08:12:43'),
  (23192,'23192-8e2fec2eb1c9e06ef8eb1a82','Pocket for CloudMagic','When you find a link in a mail you want to view later, put it in Pocket.',NULL,6,'1419f113f822767','amd',0,0,1,'2014-01-28 08:12:43','2014-01-28 08:12:43'),
  (23192,'23192-1b4234bcbb54dcf1822dbe96','Pocket for CloudMagic','When you find a link in a mail you want to view later, put it in Pocket.',NULL,8,'307eb95ac19b199','amd',0,0,1,'2014-01-28 08:12:43','2014-01-28 08:12:43'),
  (23192,'23192-7d825e84f46a57fd41cc9db8','Pocket for CloudMagic','When you find a link in a mail you want to view later, put it in Pocket.',NULL,10,'6c9c6927cf16a50','amd',0,0,1,'2014-01-28 08:12:43','2014-01-28 08:12:43'),
  (23192,'23192-1dfb64d9f7e957694647fb6f','Pocket for CloudMagic','When you find a link in a mail you want to view later, put it in Pocket.',NULL,11,'c462e22c99b047f','amd',0,0,1,'2014-01-28 08:12:43','2014-01-28 08:12:43'),
  (23283,'23283-dd493d5fba22fd9b6f39e35a','Pocket for Yandex','Pocket extension for the Yandex.browser',NULL,6,'3e00e702175e483','amd',2,1,1,'2014-01-30 18:38:44','2014-01-30 18:38:44'),
  (23470,'23470-c9247153a5f87447fbf423f9','Pocket for Windows Phone','A Windows Phone Client for Pocket',NULL,7,'e0b7950ee71b18f','amd',0,0,0,'2014-02-05 02:18:01','2014-02-05 02:18:01'),
  (23470,'23470-55f10d80b7411f7092b4c2d2','Pocket for Windows Phone','A Windows Phone Client for Pocket',NULL,8,'6d621b596bb10c0','amd',0,0,1,'2014-02-05 02:18:01','2014-02-05 02:18:01'),
  (23537,'23537-e6bc9bdedd45fd81809581f6','Pocket for Windows Phone','A Windows Phone Client for Pocket',NULL,7,'be3b66736603e1a','amd',0,0,1,'2014-02-06 16:17:28','2014-02-06 16:17:28'),
  (23951,'23951-965d81ec25d24c0f2f82a139','Pocket for Android (Nokia App Store)','Official Pocket app for Android (Nokia App Store)',NULL,4,'b06175c1af4bd48','amd',1,1,1,'2014-02-15 23:35:50','2014-02-15 23:35:50'),
  (23952,'23952-a045e88307937c9db83635c7','Pocket for Android Tablet (Nokia App Store)','Official Pocket app for Android Tablet (Nokia App Store)',NULL,5,'4d55e042992f06b','amd',1,1,1,'2014-02-15 23:36:37','2014-02-15 23:36:37'),
  (24644,'24644-6746e6f4590b52a44670017c','pocket for BlackBerry 10','Pocket client for BlackBerry 10',NULL,10,'b9dcbc211e1f6d6','amd',0,0,0,'2014-03-05 03:20:01','2014-03-05 03:20:01'),
  (24715,'24715-6b16990c37bb8ebac9f939d9','Pocket for WP','Pocket client for Windows Phone 8',NULL,7,'a0968079f720bfe','amd',0,0,1,'2014-03-07 05:58:39','2014-03-07 05:58:39'),
  (24890,'24890-9aace3c4174cc6629a5403b1','Pocket for Kindle','Pocket Web viewer with no javascript, deigned for kindle (3rd gen.).',NULL,9,'c1fc7ffdbe24b34','amd',0,0,1,'2014-03-11 13:30:52','2014-03-11 13:30:52'),
  (24892,'24892-d45c2f4798226a724627b740','Pocket for Python','Uses pocket API to save articles using python language.',NULL,11,'bbf21ff08a89216','amd',0,0,0,'2014-03-11 14:07:58','2014-03-11 14:07:58'),
  (25039,'25039-3368feed935b1b8e530be0fc','Pocket for Android (Yandex App Store)','Official Pocket app for Android (Yandex App Store)',NULL,4,'a8e90294be4c509','amd',1,1,1,'2014-03-15 12:12:11','2014-03-15 12:12:11'),
  (25040,'25040-a827bc220a8376dc6e942964','Pocket for Android Tablet (Yandex App Store)','Official Pocket app for Android Tablet (Yandex App Store)',NULL,5,'e66c175bc78681e','amd',1,1,1,'2014-03-15 12:12:52','2014-03-15 12:12:52'),
  (26903,'26903-41064c69937aa1858ed7fdbb','Pocket For PyroCMS','Pocket For PyroCMS',NULL,9,'5b7b8c97211a2ef','d',0,0,1,'2014-04-26 18:33:17','2014-04-26 18:33:17'),
  (28600,'28600-afa17733fd7632b6396c9925','Pocket for Kindle','Pocket client for Kindle 5/PW',NULL,10,'cc4d6ed04eb10d0','amd',0,0,1,'2014-06-08 13:17:55','2014-06-08 13:17:55'),
  (28727,'28727-f116424d9afcf2d740c05f0b','Pocket for Android (Samsung App Store)','Official Pocket for Android mobile app for Samsung App Store',NULL,4,'3661fe75c890166','amd',1,1,1,'2014-06-11 13:51:05','2014-06-11 13:51:05'),
  (28728,'28728-642c928305508057444d45c2','Pocket for Android Tablet (Samsung App Store)','Official Pocket for Android tablet app for Samsung App Store',NULL,5,'19e42ab95fb5ca0','amd',1,1,1,'2014-06-11 13:51:31','2014-06-11 13:51:31'),
  (29012,'29012-82532461e9f7c68028f96d29','pocket for pentadactyl','a plugin to manage pocket and access stored pages from pentadactyl, a firefox addon',NULL,11,'e7958336a6c3cba','amd',0,0,0,'2014-06-19 06:50:50','2014-06-19 06:50:50'),
  (29497,'29497-2fde6d4b4448462f4c5960a9','Pocket for Web','Just for test',NULL,9,'6ba8edd6697a481','amd',0,0,1,'2014-07-03 03:44:34','2014-07-03 03:44:34'),
  (29499,'29499-43915abf0282c16494891b58','Pocket for Web','Just for test',NULL,9,'75f33c55436c58d','amd',0,0,1,'2014-07-03 03:47:36','2014-07-03 03:47:36'),
  (29847,'29847-18d9195d20d15d789d6e05e8','Pocket for Windows','A desktop app for Windows computers.',NULL,8,'ed75cfbf182f12d','amd',0,0,1,'2014-07-13 04:07:29','2014-07-13 04:07:29'),
  (30555,'30555-99afb4083021a642a93397f6','Pocket for Firefox OS','This app allow you to get all the stuff that are in your pocket account on your Firefox OS phone.',NULL,10,'a347273baa31a18','amd',0,0,1,'2014-08-02 11:46:18','2014-08-02 11:46:18'),
  (33083,'33083-950656de3e01a23a826abab1','Pocket for WordPress','Wordpress plugin that lets you display your Pocketed articles',NULL,9,'3ba902317ef5fe6','amd',0,0,1,'2014-10-08 00:40:54','2014-10-08 00:40:54'),
  (34687,'34687-995c57552f9cf61f697a36c1','Pocket For Windows Phone','Unofficial pocket app for Windows Phone',NULL,7,'84e370d0baad669','amd',0,0,1,'2014-11-18 05:54:54','2014-11-18 05:54:54'),
  (34687,'34687-10a19604df48cb965571dff2','Pocket For Windows Phone','Unofficial pocket app for Windows Phone',NULL,8,'df5d11176ef3369','amd',0,0,1,'2014-11-18 05:54:54','2014-11-18 05:54:54'),
  (35116,'35116-5bfa2cbdb4fcb339fa53f7f9','Pocket for Pebble','A Pebble app that allows Pocket account management.',NULL,3,'3843ef8af60c11c','amd',0,0,1,'2014-11-28 00:49:35','2014-11-28 00:49:35'),
  (35839,'35839-f01debdbd0613b47edb1b8f4','Pocket for anything','manage pocket',NULL,1,'f97d9ff050a0aee','amd',0,0,1,'2014-12-18 01:21:58','2014-12-18 01:21:58'),
  (35839,'35839-006a7add726328de49a1ca43','Pocket for anything','manage pocket',NULL,2,'ea1aaf5ec07989d','amd',0,0,1,'2014-12-18 01:21:58','2014-12-18 01:21:58'),
  (35839,'35839-17e740690af973b8d523dd4a','Pocket for anything','manage pocket',NULL,4,'fb03ca70afc16a6','amd',0,0,1,'2014-12-18 01:21:58','2014-12-18 01:21:58'),
  (35839,'35839-ce2f923236adfe91bab57de1','Pocket for anything','manage pocket',NULL,5,'aa1c5d0c94cf4d1','amd',0,0,1,'2014-12-18 01:21:58','2014-12-18 01:21:58'),
  (35839,'35839-4b306e368a961d0d207df08b','Pocket for anything','manage pocket',NULL,6,'bcc174d0fec8e25','amd',0,0,1,'2014-12-18 01:21:58','2014-12-18 01:21:58'),
  (35839,'35839-6511422a180384985b642494','Pocket for anything','manage pocket',NULL,9,'0da2b4f34a849e1','amd',0,0,1,'2014-12-18 01:21:58','2014-12-18 01:21:58'),
  (38003,'38003-3dd4b131ee87234f8b12f151','Pocket for Roku','This app helps you read your Pocket articles on Roku',NULL,10,'a2454215b1a3cf3','amd',0,0,1,'2015-02-13 15:33:23','2015-02-13 15:33:23'),
  (38767,'38767-70f457996273e97445b7e8f4','Pocket for Kitt','Save pages quickly and easily to Pocket, access your Pocket reading list directly from the Kitt browser',NULL,1,'d24056e5b63a1f6','amd',0,0,1,'2015-03-06 09:33:45','2015-03-06 09:33:45'),
  (38870,'38870-48abccf4d4a3edefc8b918ee','Pocket for Windows','Pocket for Windows Phone',NULL,7,'004728f20b03f42','amd',0,0,1,'2015-03-09 21:35:36','2015-03-09 21:35:36'),
  (38870,'38870-b38ca2762f96c5bf19a18a5e','Pocket for Windows','Pocket for Windows Phone',NULL,8,'f2108820948c82c','amd',0,0,1,'2015-03-09 21:35:36','2015-03-09 21:35:36'),
  (39531,'39531-6a85cbb3d9ee7f45c91514cf','Pocket for WP8.1','Pocket for Windows Phone 8.1',NULL,7,'afce3ee0559a28c','a',0,0,0,'2015-03-28 06:00:29','2015-03-28 06:00:29'),
  (39532,'39532-4caf824408274be2b94ed2c1','Pocket for WP8.1','Pocket for Windows Phone 8.1',NULL,7,'d4421a13f52cf13','amd',0,0,1,'2015-03-28 06:02:28','2015-03-28 06:02:28'),
  (39541,'39541-aae5409c5a12a53b47d7e2d1','Pocket for Kindle','Embed pocket articles to your website and access with kindle browser',NULL,9,'d009f44df5ec38e','d',0,0,1,'2015-03-28 09:45:41','2015-03-28 09:45:41'),
  (40249,'40249-e88c401e1b1f2242d9e441c4','Pocket for Firefox Integration','Integration of Pocket into Firefox',NULL,6,'b7c259fc35eafa8','amd',2,1,1,'2015-04-16 22:10:43','2015-04-16 22:10:43'),
  (42594,'42594-899898aaa730dbee74ad596f','Pocket For Site','Archives for jaredmjones.com',NULL,9,'5f5918267f7674e','d',0,0,1,'2015-06-20 22:32:03','2015-06-20 22:32:03'),
  (42692,'42692-d13d66d11989986412dd6ce8','Pocket for Safari (Gallery)','Official Pocket extension for Safari. From the Safari Extensions Gallery.',NULL,6,'23c866746f54419','amd',0,0,1,'2015-06-23 18:08:01','2015-06-23 18:08:01'),
  (43508,'43508-995cd322edc190744c0aa4e8','Pocket for Android (Google Play Beta)','Official Android app for Google Play Beta',NULL,4,'64c6e01f1ac9423','amd',1,1,1,'2015-07-15 10:51:49','2015-07-15 10:51:49'),
  (43509,'43509-0af37a7d8d192c5b6d18d70a','Pocket for Android Tablet (Google Play Beta)','Official Android Tablet app for Google Play Beta',NULL,5,'a9a9165ecc2e1ab','amd',1,1,1,'2015-07-15 10:52:49','2015-07-15 10:52:49'),
  (43510,'43510-b5e29cb938468b4e21c311cb','Pocket for iPhone (Enterprise)','Official Pocket for iPhone app for Enterprise build',NULL,1,'38ec636e3c474ae','amd',1,1,1,'2015-07-15 10:53:35','2015-07-15 10:53:35'),
  (43511,'43511-8e20114702155bdebd26b0db','Pocket for iPad (Enterprise)','Official Pocket for iPad app for Enterprise build',NULL,2,'3fd832182711e23','amd',1,1,1,'2015-07-15 10:54:09','2015-07-15 10:54:09'),
  (43713,'43713-31759e8b1c4e214e03622b27','pocket for wordpress','pocket for wordpress',NULL,9,'d4cbb8d440dde85','d',0,0,1,'2015-07-21 11:01:47','2015-07-21 11:01:47'),
  (43738,'43738-ec4827b9e0f58181aad67f74','Pocket For Firefox OS','A Pocket client for Firefox OS',NULL,9,'c26452383275dd3','amd',0,0,1,'2015-07-22 02:31:25','2015-07-22 02:31:25'),
  (43738,'43738-90351e4131a41ffce83a9c8f','Pocket For Firefox OS','A Pocket client for Firefox OS',NULL,10,'0d4f16af0efc84e','amd',0,0,1,'2015-07-22 02:31:25','2015-07-22 02:31:25'),
  (47529,'47529-e2dd2563ce7336528711643e','Pocket for Ubuntu','Pocket for Ubuntu app',NULL,11,'d5da17fae369aaf','amd',0,0,1,'2015-11-02 02:48:45','2015-11-02 02:48:45'),
  (48739,'48739-aafdbcdef231170296eb8dcd','Pocket for desktop','Use Pocket on Desktop',NULL,8,'489368dfe725996','amd',0,0,1,'2015-12-03 05:31:03','2015-12-03 05:31:03'),
  (48739,'48739-eee47cad59008572033ff43d','Pocket for desktop','Use Pocket on Desktop',NULL,11,'b5789a1fb0d09e9','amd',0,0,1,'2015-12-03 05:31:03','2015-12-03 05:31:03'),
  (49306,'49306-a3b62f577b936bade9d4a19f','Pocket for windows','This application is for pocket.com you can see your saved links',NULL,7,'78c88b36a3360b7','amd',0,0,1,'2015-12-19 03:57:20','2015-12-19 03:57:20'),
  (49593,'49593-1fb77ea5c51d67d127b5a776','Pocket for Ubuntu','Pocket client for Ubuntu',NULL,10,'55542bc6bde8002','amd',0,0,1,'2015-12-28 13:14:20','2015-12-28 13:14:20'),
  (49593,'49593-e0feafbc54117f527506b99d','Pocket for Ubuntu','Pocket client for Ubuntu',NULL,11,'1b7bc2d6eaabf92','amd',0,0,1,'2015-12-28 13:14:20','2015-12-28 13:14:20'),
  (51673,'51673-df199dd9b88146e016dd3cad','Pocket for Pebble','Read saved Pocket articles on your Pebble device.',NULL,9,'ea004889233cb2e','md',0,0,1,'2016-02-21 14:52:49','2016-02-21 14:52:49'),
  (51673,'51673-142a16276f9d4a93c63ffa40','Pocket for Pebble','Read saved Pocket articles on your Pebble device.',NULL,10,'9c8aaf335a52af9','md',0,0,1,'2016-02-21 14:52:49','2016-02-21 14:52:49'),
  (53340,'53340-34a5789c89f268f13a90cf08','Pocket for Web (API)','Consumer key used to access the API via the web',NULL,9,'b1dff673545495d','amd',2,0,1,'2016-04-07 10:55:52','2016-04-07 10:55:52'),
  (53720,'53720-f36d6ecabb107bbb7c3b5ab9','Pocket for Microsoft Edge','The official Pocket extension for Microsoft Edge',NULL,6,'e395f91fc7024ba','amd',2,1,1,'2016-04-18 12:07:05','2016-04-18 12:07:05'),
  (54691,'54691-09d5cd63ee472f300e779e10','Pocket for Python','Python Test for Pocket API',NULL,1,'bbfdfe18b8393c1','amd',0,0,1,'2016-05-18 06:59:10','2016-05-18 06:59:10'),
  (54691,'54691-d5f3516868c2fa32e96c9b18','Pocket for Python','Python Test for Pocket API',NULL,4,'92860ab2648335b','amd',0,0,1,'2016-05-18 06:59:10','2016-05-18 06:59:10'),
  (54691,'54691-3e69fb9dd9323225cd866c47','Pocket for Python','Python Test for Pocket API',NULL,9,'6798c51507257a2','amd',0,0,1,'2016-05-18 06:59:10','2016-05-18 06:59:10'),
  (54784,'54784-d5502439705ef515bf81a444','Pocket for Linux','Pocket Client for Linux Desktops',NULL,11,'2c62f680aeba4bc','amd',0,0,0,'2016-05-21 09:56:20','2016-05-21 09:56:20'),
  (55550,'55550-21424360813af700ff5a0a6f','pocket for Vimperator','pocket for Vimperator',NULL,1,'3796aaabbdc7526','amd',0,0,1,'2016-06-15 08:22:33','2016-06-15 08:22:33'),
  (55550,'55550-c8fdaded4f73c8538f4e362d','pocket for Vimperator','pocket for Vimperator',NULL,2,'5e832a2ae28a7aa','amd',0,0,1,'2016-06-15 08:22:33','2016-06-15 08:22:33'),
  (55550,'55550-1573b808c87e363d9402ba39','pocket for Vimperator','pocket for Vimperator',NULL,3,'6fced152c09fd56','amd',0,0,1,'2016-06-15 08:22:33','2016-06-15 08:22:33'),
  (55550,'55550-4b66744745e3852a930f83bb','pocket for Vimperator','pocket for Vimperator',NULL,4,'89a9e791973451c','amd',0,0,1,'2016-06-15 08:22:33','2016-06-15 08:22:33'),
  (55550,'55550-e110a4332263842a97e45ccf','pocket for Vimperator','pocket for Vimperator',NULL,5,'d037ee3caee6699','amd',0,0,1,'2016-06-15 08:22:33','2016-06-15 08:22:33'),
  (55550,'55550-a46399f74dba5994492a19cb','pocket for Vimperator','pocket for Vimperator',NULL,8,'2a1f1ce1f23d615','amd',0,0,1,'2016-06-15 08:22:33','2016-06-15 08:22:33'),
  (55550,'55550-9238891582f4202ee7609bd6','pocket for Vimperator','pocket for Vimperator',NULL,11,'b4fb0379da02819','amd',0,0,1,'2016-06-15 08:22:33','2016-06-15 08:22:33'),
  (56335,'56335-0c0e940b8370fb6a39e3260a','Pocket for Alfred','Pocket for Alfred',NULL,3,'a503ab4f9cd97e7','d',0,0,0,'2016-07-07 21:12:19','2016-07-07 21:12:19'),
  (56400,'56400-d36dd8c3dd4d4b9b8b7e6c20','Pocket for WP','Access all your pocket articles and even read them offline.',NULL,7,'536f829ecfad03f','amd',0,0,1,'2016-07-10 11:45:44','2016-07-10 11:45:44'),
  (56400,'56400-3448d85d28b75e86835852bc','Pocket for WP','Access all your pocket articles and even read them offline.',NULL,8,'c3ffaae0554efcc','amd',0,0,1,'2016-07-10 11:45:44','2016-07-10 11:45:44'),
  (56694,'56694-41da4d4ba9d03ece07fb35a4','Pocket for Firefox Recommendation Integration (Dev','Development key',NULL,6,'f4ee1d2b07be65d','amd',0,0,1,'2016-07-19 22:43:31','2016-07-19 22:43:31'),
  (56695,'56695-456880ce1b3a43b6c1db8b6f','Pocket for Firefox Recommendation Integration (Sta','Staging key',NULL,6,'a54f0b66b4db0c1','amd',0,0,1,'2016-07-19 22:43:48','2016-07-19 22:43:48'),
  (56696,'56696-8ca1651805611fc4d1b7bc59','Pocket for Firefox Recommendation Integration (Pro','Production key',NULL,6,'6a0266768d2bb17','amd',0,0,1,'2016-07-19 22:44:08','2016-07-19 22:44:08'),
  (57297,'57297-9711bd686eb1485b8c250603','Pocket for Linux','Pocket Client for Linux Desktops',NULL,11,'7a67182b74be113','amd',0,0,0,'2016-08-08 21:09:15','2016-08-08 21:09:15'),
  (57298,'57298-ec85f67bc5f3f7f07193a1cf','Pocket for Linux','Pocket Client for Linux Desktops',NULL,11,'d5ba3b262b5935c','amd',0,0,1,'2016-08-08 21:10:00','2016-08-08 21:10:00'),
  (58398,'58398-c75d6adab1f1a61c1c0101ca','pocket for kindle','Make pocket content available for the kindle simplified browser',NULL,9,'e343f770b20b03a','md',0,0,1,'2016-09-13 09:59:46','2016-09-13 09:59:46'),
  (58702,'58702-143cb8f4b06ee7ba5c3bcf72','Pocket for Windows','Pocket for Windows',NULL,8,'5720311ca837351','amd',0,0,1,'2016-09-22 16:59:25','2016-09-22 16:59:25'),
  (78809,'78809-9423d8c743a58f62b23ee85c','Pocket for Web','Pocket for Web',NULL,8,'f44f7d916970f22','amd',2,0,1,'2018-07-24 23:44:16','2018-07-24 23:44:16'),
  (80459, '80459-c166251cb4a446e30cf6fff2', 'Pocket Listen Server', 'API key used by Pocket listen server', NULL, 11, 'bfd14cbce76862f', 'amd', 2, 0, 1, '2018-09-10 19:36:59', '2018-09-10 19:36:59'),
  (83720, '83720-9b9392fdd9d63181e33b5f83', 'Pocket Widget', 'widets.getpocket.com', null, 9, '7d81c5075fac934', 'a', 0, 0, 1, '2019-01-31 17:34:14', '2019-01-31 17:34:14'),
  (86291, '86291-f8d3e654be359e75b7625e79', 'Pocket Web', 'getpocket.com', NULL, 9, 'f904414b3b9baa5', 'd', 0, 0, 1, '2019-06-04 20:11:16', '2019-06-04 20:11:16'),
  (94110, '94110-6d5ff7a89d72c869766af0e0', 'Pocket web-client', 'Official Pocket web-client keys', null, 9, '3efe4eef70e8412', 'amd', 1, 1, 1, '2020-11-06 11:25:57', '2020-11-06 11:25:57');

insert ignore into`readitla_ril-tmp`.`api_domains`
(id, api_id, domain, created_at, updated_at)
values
(1, 78809, 'd1au3gwil4ewwb.cloudfront.net', '2016-10-06 23:00:07', '2016-10-06 23:00:07'),
(2, 78809, 'reader.getpocket.com', '2016-10-06 23:00:07', '2016-10-06 23:00:07'),
(3, 78809, 'reader.localhost', '2016-10-06 23:00:07', '2016-10-06 23:00:07'),
(4, 78809, 'localhost', '2016-10-06 23:00:07', '2016-10-06 23:00:07'),
(5, 78809, 'av.dev.readitlater.com', '2018-09-21 11:00:00', '2018-09-21 11:00:00'),
(6, 78809, 'app.getpocket.com', '2016-10-06 23:00:07', '2016-10-06 23:00:07'),
(7, 78809, 'app-stage.readitlater.com', '2018-10-16 23:00:07', '2018-10-16 23:00:07'),
(8, 83720, 'widgets.getpocket.com', '2019-02-01 17:21:17', '2019-02-01 17:21:17'),
(9, 83720, 'widgets.getpocket.localhost', '2019-02-01 17:21:17', '2019-02-01 17:21:17'),
(10, 83720, 'widget-demo.readitlater.com', '2019-02-01 17:21:17', '2019-02-01 17:21:17'),
(11, 86291, 'getpocket.com', '2019-02-01 17:21:17', '2019-02-01 17:21:17'),
(12, 86291, 'getpocket.localhost', '2019-02-01 17:21:17', '2019-02-01 17:21:17'),
(26, 94110, 'localhost.web-client.getpocket.com', '2020-11-06 11:42:38', '2020-11-06 11:42:38'),
(27, 94110, '*.web-client.getpocket.dev', '2020-11-06 11:42:46', '2020-11-06 11:42:46'),
(28, 94110, 'www.getpocket.com', '2020-11-06 11:42:51', '2020-11-06 11:42:51'),
(29, 94110, 'getpocket.com', '2020-11-06 11:42:57', '2020-11-06 11:42:57'),
(30, 94110, 'localhost.web-client.getpocket.com:8080', '2020-12-16 15:39:25', '2020-12-16 15:39:25'),
(31, 94110, 'dotcom-gateway-stage.getpocket.com', '2021-02-23 17:11:45', '2021-02-23 17:11:45'),
(32, 94110, 'dotcom-gateway-stage.getpocket.com', '2021-02-23 17:20:25', '2021-02-23 17:20:25'),
(39, 94110, 'web-client.pocketlocal.dev', '2021-04-22 11:21:23', '2021-04-22 11:21:23'),
(41, 94110, 'studio.apollographql.com', '2022-01-06 10:29:37', '2022-01-06 10:29:37'),
(42, 94110, 'web.pocketlocal.dev', '2022-01-06 10:29:37', '2022-01-06 10:29:37'),
(43, 94110, 'pocketlocal.dev', '2022-01-06 10:29:37', '2022-01-06 10:29:37'),
(44, 94110, '*.pocketlocal.dev', '2022-01-06 10:29:37', '2022-01-06 10:29:37');

REPLACE INTO `api_users` (`api_id`, `name`, `website`, `via_domain`, `platform`, `email`, `apikey`, `status`, `time_created`, `is_native`, `is_trusted`, `permission`, `allow_reverse`, `user_id`)
VALUES
  (40249,'Pocket for Firefox Integration','','','','','',1,'2016-10-06 23:00:07',2,1,'amd',0,0),
  (5512,'Pocket for iPhone','http://readitlater.com','','iPhone','','',1,'2016-10-06 23:00:07',1,1,'amd',0,0),
  (5513,'Pocket for Android','http://readitlater.com','','Android','support@readitlater.com','',1,'2016-10-06 23:00:07',1,1,'amd',0,0),
  (78809,'Pocket for Web','','','','','',1,'2016-10-06 23:00:07',2,1,'amd',0,0),
  (80459, 'Pocket Listen Server', '', '', '', '', '', 1, '2018-09-10 19:36:59', 2, 1, 'amd', 0, 0),
  (83720, 'Pocket Widget', '', '', '', '', '', 1, '2019-01-31 17:34:14', 0, 0, 'a', 0, 0),
  (86291, 'Pocket Web', '', '', '', '', '', 1, '2019-06-04 20:11:16', 2, 1, 'amd', 0, @user_id ),
  (94110, 'Pocket web-client', '', '', '', '', '', 1, '2020-11-06 11:25:57', 1, 1, 'amd', 0, @user_id );


REPLACE INTO `oauth_user_access` (`user_id`, `consumer_key`, `access_token`, `permission`, `status`)
VALUES
  (@user_id,'5512-ed03e9997ac783070c2efdc8','52e337b9-be35-16b1-cfb0-ae0d95','amd',1),
  (@user_id,'5513-8646141fb5902c766272e74d','52e337b9-be35-16b1-cfb0-ae0d95','amd',1),
  (@user_id,'40249-e88c401e1b1f2242d9e441c4','52e337b9-be35-16b1-cfb0-ae0d95','amd',1),
  (@fx_user_id,'40249-e88c401e1b1f2242d9e441c4','52e337b9-be35-16b1-cfb0-ae0d97','amd',1),
  (@premium_user_id,'40249-e88c401e1b1f2242d9e441c4','52e337b9-be35-16b1-cfb0-ae0d96','amd',1),
  (@old_premium_user_id,'40249-e88c401e1b1f2242d9e441b2','52e337b9-be35-16b1-cfb0-ae0d96','amd',1);


REPLACE INTO `user_ip` (`id`, `user_id`, `event_type`, `ip`, `api_id`, `time_added`, `days_since`, `threat_score`, `visitor_type`)
VALUES
  (598366,@user_id,'signup','192.168.4.1',0,1475761587,0,0,0);

REPLACE INTO `user_locale` (`user_id`, `api_id`, `locale`, `country`, `language`, `birth`, `birth_type`)
VALUES
  (@user_id,0,'en','US','en-US','2016-10-06 13:46:27',1);

REPLACE INTO `user_profile` (`user_id`, `username`, `name`, `description`, `avatar_url`, `follower_count`, `follow_count`, `post_count`, `data`, `time_updated`)
VALUES
  (@user_id,NULL,X'666F6F62617232',NULL,X'',0,0,0,NULL,1475761586),
  (@other_user_id,NULL,'Other User','Hi I am another user','',0,0,0,NULL,1475761586),
  (@fx_user_id,NULL,'Vlad Dracula','Hi I am the lord of darkness','',0,0,0,NULL,1475761586),
  (@premium_user_id,NULL,'Cool Premium User','Hi I am a premium user','',0,0,0,NULL,1475761586),
  (@old_premium_user_id,NULL,'Cool Old Premium User','Hi I am an old premium user','',0,0,0,NULL,1475761586);

REPLACE INTO `user_setting` (`user_id`, `setting_id`, `value`, `time_updated`)
VALUES
  (@user_id,11,'daily',1475761587);

REPLACE INTO `users` (`user_id`, `feed_id`, `password`, `email`, `first_name`, `last_name`, `feed_protected`, `login_hash`, `birth`, `last_syncer`, `api_id`, `premium_status`)
VALUES
   -- password: foobar
  (@user_id,'*em1475760727247e2a1','7f808a88d7505bc1d370dab2ece2032b56ce15fd4d59fb36e6934483247c7494','foo@bar.com','foobar','',1,'','2016-10-06 13:46:26','',0,0),
   -- password: fangsrule
  (@fx_user_id,'*em1475760727247e2a4','915283eb9d64cba3816af12465159709f42ec57922a71903f0f9a87625332daf','vlad@dracula.com','vlad','',1,'','2016-10-06 13:46:26','',0,0),
  (@other_user_id,'*em1475760727247e2a2','390fa394f1e5f6c162a14a0ff1898320fe42af998aeb9ce61a46504c9ed8993e','sam@spam.com','sam','spam',1,'','2016-11-04 10:15:39','',0,0),
  (@premium_user_id,'*em1475760727247e2a3','6d4b56ece71b15efd5093c72721fdce7c761e491e3ad51ddaac59f88ba848ec0','premium@bar.com','billy','joel',1,'','2016-11-04 10:15:39','',0,1),
  (@old_premium_user_id,'*em15587299626677e90','736cdbd55bb15e8e7ea95db380512de7de8fc03f49491d601ec8c2c6b69c3290','oldpremium@bar.com','oldbilly','joel',1,'','2016-11-04 10:15:39','',0,1);

REPLACE INTO users_meta (user_id, property, value, time_updated, updated_at)
VALUES
(@user_id, 83, 1, '2018-11-03 22:45:52', '2019-08-05 22:12:24'),
(@fx_user_id, 83, 1, '2018-11-03 22:45:52', '2019-08-05 22:12:24');


REPLACE INTO `users_meta` (`user_id`, `property`, `value`, `time_updated`)
VALUES
  (@user_id,22,'signup','2016-10-06 13:46:27'),
  (@user_id,38,'2016-10-06 08:32:08','2016-10-06 13:46:27'),
  (@user_id,41,'2016-10-06 09:30:21','2016-10-06 14:44:38'),
  (@user_id,42,'1','2016-10-06 13:46:27'),
  (@user_id,45,'{\"active\":true,\"sawinitoverlay\":true,\"postextensioninitoverlay\":false,\"extinstalled\":false,\"extinstalledFFemail\":false,\"extinstalledFFfxa\":false,\"extinstalledFFgpa\":false,\"articleview\":false,\"articleviewconfirm\":false,\"articleviewitemactions\":false,\"saveditems\":[]}','2016-10-06 14:45:29'),
  (@user_id,46,'{\"lastQueueView\":\"grid\",\"fontbundle\":\"standard\",\"sawbundleupsell\":true,\"recommendedmodeupsell\":true,\"sawarchivetooltip\":false,\"existingprerecommend\":false,\"dismisseddevicereminder\":true,\"seenrecommendedmessage\":true}','2016-10-06 14:53:21'),
  (@user_id,53,'2016-10-06 09:30:22','2016-10-06 14:44:40'),
  (@user_id,55,'1475764743','2016-10-06 14:53:21'),
  (@user_id,57,'1','2016-10-06 14:44:38'),
  (@user_id, 91, '', '2018-10-26 01:15:02'),
  (@user_id, 92, '', '2018-11-03 22:45:52'),
  (@user_id, 93, '', '2018-09-26 19:46:00'),
  (@fx_user_id,22,'signup','1999-12-31 23:59:59'),
  (@premium_user_id,22,'signup','2016-10-06 13:46:27'),
  (@premium_user_id,38,'2016-10-06 08:32:08','2016-10-06 13:46:27'),
  (@premium_user_id,41,'2016-10-06 09:30:21','2016-10-06 14:44:38'),
  (@premium_user_id,42,'1','2016-10-06 13:46:27'),
  (@premium_user_id,45,'{\"active\":true,\"sawinitoverlay\":true,\"postextensioninitoverlay\":false,\"extinstalled\":false,\"extinstalledFFemail\":false,\"extinstalledFFfxa\":false,\"extinstalledFFgpa\":false,\"articleview\":false,\"articleviewconfirm\":false,\"articleviewitemactions\":false,\"saveditems\":[]}','2016-10-06 14:45:29'),
  (@premium_user_id,46,'{\"lastQueueView\":\"grid\",\"fontbundle\":\"standard\",\"sawbundleupsell\":true,\"recommendedmodeupsell\":true,\"sawarchivetooltip\":false,\"existingprerecommend\":false,\"dismisseddevicereminder\":true,\"seenrecommendedmessage\":true}','2016-10-06 14:53:21'),
  (@premium_user_id,53,'2016-10-06 09:30:22','2016-10-06 14:44:40'),
  (@premium_user_id,55,'1475764743','2016-10-06 14:53:21'),
  (@premium_user_id,57,'1','2016-10-06 14:44:38'),
  (@premium_user_id, 91, '', '2018-10-26 01:15:02'),
  (@premium_user_id, 92, '', '2018-11-03 22:45:52'),
  (@premium_user_id, 93, '', '2018-09-26 19:46:00'),
  (@premium_user_id, 97, 'beta', '2018-09-26 19:47:00'),
  (@old_premium_user_id,22,'signup','2016-10-06 13:46:27'),
  (@old_premium_user_id,38,'2016-10-06 08:32:08','2016-10-06 13:46:27'),
  (@old_premium_user_id,41,'2016-10-06 09:30:21','2016-10-06 14:44:38'),
  (@old_premium_user_id,42,'1','2016-10-06 13:46:27'),
  (@old_premium_user_id,45,'{\"active\":true,\"sawinitoverlay\":true,\"postextensioninitoverlay\":false,\"extinstalled\":false,\"extinstalledFFemail\":false,\"extinstalledFFfxa\":false,\"extinstalledFFgpa\":false,\"articleview\":false,\"articleviewconfirm\":false,\"articleviewitemactions\":false,\"saveditems\":[]}','2016-10-06 14:45:29'),
  (@old_premium_user_id,46,'{\"lastQueueView\":\"grid\",\"fontbundle\":\"standard\",\"sawbundleupsell\":true,\"recommendedmodeupsell\":true,\"sawarchivetooltip\":false,\"existingprerecommend\":false,\"dismisseddevicereminder\":true,\"seenrecommendedmessage\":true}','2016-10-06 14:53:21'),
  (@old_premium_user_id,53,'2016-10-06 09:30:22','2016-10-06 14:44:40'),
  (@old_premium_user_id,55,'1475764743','2016-10-06 14:53:21'),
  (@old_premium_user_id,57,'1','2016-10-06 14:44:38'),
  (@old_premium_user_id, 91, '', '2018-10-26 01:15:02'),
  (@old_premium_user_id, 92, '', '2018-11-03 22:45:52'),
  (@old_premium_user_id, 93, '', '2018-09-26 19:46:00');
REPLACE INTO `users_services` (`user_id`, `service_id`, `username`, `confirmed`)
VALUES
  (@user_id,2,'foo@bar.com',0),
  (@fx_user_id,2,'vald@dracula.com',0),
  (@premium_user_id,2,'foo@bar.com',0),
  (@old_premium_user_id,2,'foo@bar.com',0);

REPLACE INTO `users_tokens` (`user_id`, `service_id`, `device_id`, `token`, `status`)
VALUES
  (@user_id,3,NULL,'foo@bar.com',1),
  (@user_id,4,NULL,'foo@bar.com',1),
  (@premium_user_id,3,NULL,'premium@bar.com',1),
  (@premium_user_id,4,NULL,'premium@bar.com',1),
  (@old_premium_user_id,3,NULL,'premium@bar.com',1),
  (@old_premium_user_id,4,NULL,'premium@bar.com',1);

REPLACE INTO `api_app_users` (`user_id`, `api_id`, `app_unique_id`, `last_login`, `locale`, `country`, `timezone_offset`)
VALUES
  (@user_id,0,'0','2016-10-06 14:44:38','en','US',0);

REPLACE INTO `list` (`user_id`, `item_id`, `resolved_id`, `given_url`, `title`, `time_added`, `time_updated`, `time_read`, `time_favorited`, `api_id`, `status`, `favorite`, `api_id_updated`)
VALUES
  (@user_id, 1, 2, 'http://nytimes.com/2016/07/08/us/politics/james-comey-fbi-testimony-hillary-clinton-emails.html', 'F.B.I. Director Testifies on Clinton Emails...', '2016-10-11 08:42:22', '2016-10-11 08:43:21', '0000-00-00 00:00:00', '0000-00-00 00:00:00', 5512, 0, 0, 5512),
  (@user_id, 1653422551, 1653422551, 'http://ej.ru/?a=note&id=30858', 'EJ Russian', '2016-10-11 08:42:22', '2016-10-11 08:43:21', '0000-00-00 00:00:00', '0000-00-00 00:00:00', 0, 0, 0, 0),
  (@user_id, 1808422207, 1808422207, 'https://www.vox.com/policy-and-politics/2017/7/4/15916910/july-4th-fireworks-safety','','2017-07-06 15:51:22','2017-07-07 11:30:14','2017-07-07 11:30:14','0000-00-00 00:00:00',0,1,0,0),
  (@user_id, 1514732753, 1514732753, 'https://aeon.co/videos/odourless-world-what-smell-means-to-those-who-dont-have-it','Anosmia','2016-12-12 05:36:46','2016-12-12 05:36:46','0000-00-00 00:00:00','0000-00-00 00:00:00',2782,0,0,0),
  (@user_id, 772045939, 772045939, 'https://www.youtube.com/watch?v=w0rOOdjQUIU','HARRY NILSSON In Concert (The Music of Nilsson, 1971) BEST QUALITY ON YOUTU','2015-09-19 17:50:03','2015-09-19 17:50:03','0000-00-00 00:00:00','0000-00-00 00:00:00',7035,0,0,0),
  (@user_id, 1748259901, 1748259901, 'https://medium.com/art-of-practicality/22-books-that-expand-your-mind-and-change-the-way-you-live-47da380eaf3d','22 Books That Expand Your Mind and Change The Way You Live','2017-05-22 11:16:40','2017-05-22 11:16:40','0000-00-00 00:00:00','0000-00-00 00:00:00',7035,0,0,0),
  (@user_id, 1460779530, 1460779530, 'http://paidpost.nytimes.com/philips/make-life-better/healthy-mouths-healthy-lives.html#', '', '2017-01-08 09:29:31', '2017-01-08 09:29:31', '0000-00-00 00:00:00', '0000-00-00 00:00:00', 0, 0, 0, 0),
  (@user_id, 2104094547, 2104094547, 'https://cdn.dribbble.com/users/679488/screenshots/4313053/data-sent.jpg', 'data-sent.jpg (JPEG Image, 800 × 600 pixels)', '2018-03-07 17:55:51', '2018-03-07 17:55:52', '0000-00-00 00:00:00', '0000-00-00 00:00:00', 40249, 0, 0, 0),
  (@user_id, 2136231202, 2136231202, 'https://www.wired.com/story/tricky-business-of-measuring-consciousness/', 'The Tricky Business of Measuring Consciousness | WIRED', '2018-04-09 12:50:15', '2018-04-09 12:50:15', null, null, 40249, 0, 0, 0),
  (@user_id, 2137233325, 2137233325, 'https://www.cnn.com/2018/04/03/health/reading-aloud-to-kids-go-ask-your-dad/index.html', '', '2018-04-09 12:50:32', '2018-04-09 12:50:32', null, null, 0, 0, 0, 0),
  (@user_id, 2138431914, 2138431914, 'https://www.nature.com/articles/d41586-018-03922-x', '', '2018-04-09 12:50:33', '2018-04-09 12:50:33', null, null, 0, 0, 0, 0),
  (@user_id, 2142120324, 2142120324, 'https://www.nytimes.com/interactive/2018/04/07/upshot/millions-of-eviction-records-a-sweeping-new-look-at-housing-in-america.html', '', '2018-04-09 12:50:36', '2018-04-09 12:50:36', null, null, 0, 0, 0, 0),
  (@user_id, 2142165945, 2142165945, 'https://www.theguardian.com/lifeandstyle/2018/apr/07/barbara-ehrenreich-natural-causes-book-old-enough-to-die', 'When do you know you''re old enough to die? Barbara Ehrenreich has some answ', '2018-04-09 12:50:10', '2018-04-09 12:50:10', null, null, 40249, 0, 0, 0);

REPLACE INTO `readitla_ril-tmp`.item_tags (user_id, item_id, tag, entered_by, status, time_added, api_id, time_updated, api_id_updated) VALUES
  (23219660, 2136231202, 'philosophy', '', 1, null, null, null, null),
  (23219660, 2136231202, 'science', '', 1, null, null, null, null);

REPLACE INTO `setting` (`setting_id`, `setting_category_id`, `setting_key`, `default_value`, `active`, `sort_order`)
VALUES
    (1,1,'notifications_social',NULL,1,100),
    (2,1,'notifications_social_likes','1',1,101),
    (3,1,'notifications_social_reposts','1',1,102),
    (4,1,'notifications_social_followers','1',1,103),
    (5,1,'notifications_social_shares','1',1,104),
    (6,1,'notifications_social_friends','1',1,105),
    (7,1,'notifications_recommendations',NULL,1,200),
    (8,1,'notifications_recommendations_highlights','1',1,201),
    (9,1,'notifications_pocket',NULL,1,300),
    (10,1,'notifications_pocket_product_updates','1',1,301),
    (11,3,'notifications_pocket_hits_frequency','triweekly',1,100),
    (12,1,'notifications_reminders', 1, 1, 302),
    (13,2,'notifications_digest_email', 'weekly', 1, 303);

REPLACE INTO `social_services` (`social_service_id`, `name`)
VALUES
    (1, 'facebook'),
    (2, 'twitter');

REPLACE INTO `readitla_ril-tmp`.digest_topics (topic_id, name, slug, type_id, shared)
VALUES
  (1, 'Entertainment', 'entertainment', 0, 0),
  (2, 'Business', 'business', 0, 0),
  (7, 'Education', 'education', 0, 0),
  (9, 'Politics', 'politics', 0, 0),
  (10, 'Sports', 'sports', 0, 0);

REPLACE INTO campaign
(id, campaign_type_id, name, time_created, start_date, end_date, priority, allow_override, time_schedule, active, bronto_delivery_id, email_list_name)
VALUES (87571, 8, 'Pocket_Digest_Email', 1508948293, 1508948293, 2147483647, 1, 0, null, 2, null, null);

REPLACE INTO `readitla_ril-tmp`.`curated_feeds`
  (feed_id, name, description, slug, language, hourly_cadence, queue_minimum, prospect_slack_channel, prospect_slack_channel_id, prospect_slack_webhook, feed_slack_channel, feed_slack_webhook, curate_slack_channel, curate_slack_webhook, status, time_added, time_updated)
VALUES
  (1, 'Legacy Global Feed', 'Recreation of the legacy global feed', 'global-en-US', 'en-US', 1, 12, 'prospect-global-en-us', 'G6R9Y5ACX', '', 'feed-global-en-us', '', 'curate-global-en-us', '', 'live', 1503005801, 1503005801),
  (2, 'Test Feed', 'Feed for testing deploy', 'test-feed', 'en-US', 2, 6, 'prospect-test-feed', 'G6R4YH486', '', 'feed-test-feed', '', 'curate-test-feed', '', 'off', 1503010619, 1503010619),
  (3, 'German Global Feed', 'Universal feed of German articles', 'global-de-DE', 'de-DE', 1, 12, 'prospect-global-de-de', 'G6W6T513K', '', 'feed-global-de-de', '', 'curate-global-de-de', '', 'live', 1504219517, 1504219517),
  (4, 'US Video Feed', 'Universal feed of US videos', 'video-en-US', 'en-US', 2, 6, 'prospect-video-en-us', 'G6WSEJ537', '', 'feed-video-en-us', '', 'curate-video-en-us', '', 'live', 1504219517, 1504219517),
  (5, 'Midterms 2018', 'Curated feed for the 2018 US midterm elections', 'midterms2018', 'en-US', 1, 0, 'prospect-midterms2018', 'GCW8EP5NE', '', 'feed-midterms2018', '', 'curate-midterms2018', '', 'live', 1537310702, 1537310702),
  (6, 'Great British Global Feed', 'Universal feed of GB articles', 'global-en-GB', 'en-GB', 1, 12, 'prospect-global-en-gb', '', '', 'feed-global-en-gb', '', 'curate-global-en-gb', '', 'live', 1582060651, 1582060651),
  (7, 'COVID-19', 'Curated collection of COVID-19 articles', 'covid-19', 'en-US', 1, 0, 'prospect-covid-19', '', '', 'feed-covid-19', '', 'curate-covid-19', '', 'live', 1585149463, 1585149463),
  (8, 'International English Feed', 'Universal feed for English articles', 'intl-en', 'en-US', 1, 12, 'prospect-intl-en', '', '', 'feed-intl-en', '', 'curate-intl-en', '', 'live', 1599061317, 1599689312);

REPLACE INTO `readitla_ril-tmp`.curated_feed_prospects (prospect_id, feed_id, resolved_id, type, status, curator, time_added, time_updated, top_domain_id, title, excerpt, image_src)
VALUES
  (64421, 1, 2316457532, 'global-algo-trump-filtered', 'approved', 'cohara', 1536616723, 1536616730, 745, 'China Is Detaining Muslims in Vast Numbers. The Goal: ‘Transformation.’', 'HOTAN, China — On the edge of a desert in far western China, an imposing building sits behind a fence topped with barbed wire. Large red characters on the facade urge people to learn Chinese, study law and acquire job skills. Guards make clear that visitors are not welcome.', 'https://static01.nyt.com/images/2018/09/04/world/00xinjiang-6/00xinjiang-6-facebookJumbo.jpg'),
  (64425, 1, 2314421326, 'global-algo-trump-filtered', 'approved', 'cohara', 1536616748, 1536664259, 4080, 'Wi-Fi Gets More Secure: Everything You Need to Know About WPA3', 'The biggest Wi-Fi security update in 14 years was recently unveiled by the Wi-Fi Alliance. The Wi-Fi Protected Access 3 (WPA3) security certificate protocol provides some much-needed updates to the WPA2 protocol introduced in 2004.', 'https://spectrum.ieee.org/image/MzEyNDg4NA.jpeg'),
  (64488, 1, 2313275150, 'global-algo-trump-filtered', 'approved', 'cohara', 1536664205, 1536664395, 212224, 'A football family and a sportswriter, bound by grief', 'IRVINE, Calif. -- I came of age in the wake of Woodward and Bernstein, when young journalists were taught to be as neutral as the painted highway stripe. After nearly four decades as a sportswriter, I have learned to negotiate a middle ground between my training and my life experience.', 'http://a4.espncdn.com/combiner/i?img=%2Fphoto%2F2018%2F0904%2Fr426227_1296x729_16%2D9.jpg'),
  (70480, 5, 2358084471, 'submission-cohara', 'approved', 'cohara', 1539871954, 1539871978, 745, 'Who’s Winning the Social Media Midterms?', 'After President Trump’s popularity on social media helped propel him to an upset victory in 2016, Democrats vowed to catch up.  Two years later, their efforts appear to be paying off.', 'https://static01.nyt.com/images/2018/10/17/us/social-election-promo-1539817054717/social-election-promo-1539817054717-facebookJumbo-v4.png'),
  (70479, 5, 2358086314, 'submission-cohara', 'approved', 'cohara', 1539871942, 1539871970, 726, 'Voter Turnout Could Hit 50-Year Record For Midterm Elections', 'The 2018 elections could see the highest turnout for a midterm since the mid-1960s, another time of cultural and social upheaval.  McDonald is predicting 45 to 50 percent of eligible voters will cast a ballot.', 'https://media.npr.org/assets/img/2018/10/17/gettyimages-1052056880_wide-cbe6aeaacea339934129072280d5a1774c4800f4.jpg?s=1400'),
  (70478, 5, 2358173104, 'submission-cohara', 'approved', 'cohara', 1539871927, 1539871963, 4618, 'Five Tribes of American Voters', '“Every difference of opinion,” Thomas Jefferson warned in his first inaugural address, “is not a difference of principle.” Speaking to his countrymen after an election every bit as bitter as the one that put Donald J.', 'https://assets.realclear.com/images/46/462685_5_.jpg'),
  (70382, 5, 2357496648, 'submission-cohara', 'approved', 'cohara', 1539804226, 1539804247, 11275, 'Dems shift line of attack, warning of GOP threat to Medicare', 'WASHINGTON (AP) — With the GOP tax plan contributing to rising federal deficits, Democrats are warning that Republicans will seek cuts to Medicare, Medicaid and Social Security to balance budgets if they keep control of Congress in the November election.', 'https://storage.googleapis.com/afs-prod/media/media:7eca8da6ceb64580a17b2658544b8cc3/3000.jpeg'),
  (70381, 5, 2356498090, 'submission-cohara', 'denied', 'cohara', 1539804133, 1539804213, 11275, 'Debate may be O’Rourke’s last chance to cut into Cruz lead', 'SAN ANTONIO (AP) — Democrat Beto O’Rourke is hoping to reverse polls showing him fading against Republican incumbent Ted Cruz in the second debate of a Texas Senate race that’s become one of the nation’s most-watched.', 'https://storage.googleapis.com/afs-prod/media/media:30dc5cdf34bc4890b8b26ce73ff53df4/3000.jpeg'),
  (70495, 4, 2357102167, 'video-algo-unfiltered', 'ready', NULL, 1539886206, 1539886206, 856, 'Bill Gates Breaks Down 6 Moments From His Life | WIRED', 'Bill Gates reflects on six important moments from his life and career, from teaching students to program in high school to his relationships with Melinda Gates, Warren Buffett, and Paul Allen, co-founder of Microsoft, who passed away on October 15.This video was recorded on August 31, prior to Mr. A', 'http://img.youtube.com/vi/GzUUghxDhYM/maxresdefault.jpg'),
  (70486, 4, 2357623078, 'twitter-devour', 'denied', 'cohara', 1539872026, 1539872028, 856, 'Shredding the Girl and Balloon - The Director’s Cut', '', 'http://img.youtube.com/vi/vxkwRNIZgdY/maxresdefault.jpg'),
  (70485, 4, 2356297086, 'rss-digg-video', 'denied', 'cohara', 1539872021, 1539872024, 856, 'Most Successful Weapons Ever Invented', 'The first 1,000 people to sign up to Skillshare will get their first 2 months for free: https://skl.sh/infographics34If you’ve watched our military shows, you’ll know something about weapons. You might know that the USA has spent a mind-boggling amount of money on the F-35 program.  But did the', 'http://img.youtube.com/vi/Crn-I2ZqhXg/maxresdefault.jpg'),
  (70359, 4, 2356458632, 'submission-cohara', 'approved', 'cohara', 1539788184, 1539788309, 856, 'Your Place in the Primate Family Tree', 'Our new sticker is available here: https://store.dftba.com/collections/eonsAnd check out Tacos of Texas!: https://www.youtube.com/playlist?list...Purgatorius, a kind of mammal called a plesiadapiform, might’ve been one of your earliest ancestors. But how did we get from a mouse-sized creature that', 'http://img.youtube.com/vi/dUKV02uYEu0/maxresdefault.jpg'),
  (70360, 4, 2355888227, 'submission-cohara', 'approved', 'cohara', 1539788192, 1539788311, 856, 'We’re One Step Closer to a Space Elevator', 'A space elevator sounds like science fiction, but scientists are still actively trying to make it a reality. Here’s what you need to know.Is This New Super Carbon Better Than Graphene? -  https://youtu.be/FWENEXM5S3E Read More: Going up! Japan to test mini ''space elevator''https://phys.org/news/201', 'http://img.youtube.com/vi/vYTypQO6liA/maxresdefault.jpg'),
  (70201, 4, 2355064606, 'submission-cohara', 'approved', 'cohara', 1539692025, 1539692084, 856, 'Deepfake Videos Are Ruining Lives. Is Democracy Next? | Moving Upstream', 'Computer-generated videos are getting more realistic and even harder to detect thanks to deep learning and artificial intelligence. As WSJ’s Jason Bellini finds in this episode of Moving Upstream, these so-called deepfakes can be playful, but can also have real, damaging consequences for people’', 'http://img.youtube.com/vi/Ex83dhTn0IU/maxresdefault.jpg'),
  (70202, 4, 2355010138, 'submission-cohara', 'approved', 'cohara', 1539692036, 1539692091, 856, 'The simple genius of a good graphic | Tommy McCall', 'In a talk that''s part history lesson, part love letter to graphics, information designer Tommy McCall traces the centuries-long evolution of charts and diagrams -- and shows how complex data can be sculpted into beautiful shapes. "Graphics that help us think faster, or see a book''s worth of informat', 'http://img.youtube.com/vi/6C_-VdaXgCQ/maxresdefault.jpg'),
  (70204, 4, 2355305857, 'submission-cohara', 'approved', 'cohara', 1539692046, 1539692097, 856, 'What If The US Paid Off Its Debt?', 'The first 1,000 people to sign up to Skillshare will get their first 2 months for free: https://skl.sh/infographics34What would happen to the US if it paid off its debt?SUBSCRIBE TO US -► http://bit.ly/TheInfographicsShow--------------------------------------------------------------------------WEB', 'http://img.youtube.com/vi/_3Lizrgbb9s/maxresdefault.jpg'),
  (70205, 4, 2355070814, 'submission-cohara', 'approved', 'cohara', 1539692059, 1539692099, 856, 'The Unexpected Threat To Greenland''s Melting Glaciers (HBO)', 'GREENLAND — This summer, a chunk of ice the size of lower Manhattan broke off of a glacier in Eastern Greenland. It contained 10 billion tons of ice, making the video of the event an insanely shareable capsule of climate change dread. But for NASA scientists, the spectacle created by these massive', 'http://img.youtube.com/vi/QubYjSTMGs0/maxresdefault.jpg');

REPLACE INTO `readitla_ril-tmp`.curated_feed_items
  (curated_rec_id, feed_id, resolved_id, prospect_id, queued_id, status, time_live, time_added, time_updated)
VALUES
  (23378, 1, 2316457532, 64421, 24372, 'live', 1536692400, 1536691502, 1536691502),
  (23381, 1, 2314421326, 64425, 24393, 'live', 1536696000, 1536695101, 1536695101),
  (23383, 1, 2313275150, 64488, 24394, 'removed', 1536699600, 1536698702, 1536698702),
  (25654, 4, 2355888227, 70360, 26738, 'removed', 1539889200, 1539888303, 1539888303),
  (25648, 4, 2356458632, 70359, 26737, 'live', 1539882000, 1539881103, 1539881103),
  (25557, 4, 2355070814, 70205, 26672, 'live', 1539759600, 1539758703, 1539758703),
  (25552, 4, 2355305857, 70204, 26671, 'live', 1539752400, 1539751502, 1539751502),
  (25547, 4, 2355010138, 70202, 26670, 'live', 1539745200, 1539744303, 1539744303),
  (25542, 4, 2355064606, 70201, 26669, 'live', 1539738000, 1539737103, 1539737103),
  (25593, 5, 2357496648, 70382, 26748, 'live', 1539806400, 1539805504, 1539805504),
  (25642, 5, 2358173104, 70478, 26789, 'live', 1539874800, 1539873904, 1539873904),
  (25645, 5, 2358086314, 70479, 26790, 'live', 1539878400, 1539877503, 1539877503),
  (25649, 5, 2358084471, 70480, 26791, 'live', 1539882000, 1539881103, 1539881103);

REPLACE INTO `readitla_ril-tmp`.`curated_feed_queued_items`
  (queued_id, feed_id, resolved_id, prospect_id, status, curator, relevance_length, topic_id, weight, time_added, time_updated)
VALUES
  (24372, 1, 2316457532, 64421, 'used', 'cohara', 'week', 15, 1, 1536616730, 1536691502),
  (24393, 1, 2314421326, 64425, 'ready', 'cohara', 'week', 5, 1, 1536664259, 1536695101),
  (24394, 1, 2313275150, 64488, 'ready', 'cohara', 'week', 6, 1, 1536664395, 1536698702),
  (26669, 4, 2355064606, 70201, 'ready', 'cohara', 'week', 0, 1, 1539692084, 1539737103),
  (26670, 4, 2355010138, 70202, 'used', 'cohara', 'week', 0, 1, 1539692091, 1539744303),
  (26671, 4, 2355305857, 70204, 'ready', 'cohara', 'week', 0, 1, 1539692097, 1539751502),
  (26672, 4, 2355070814, 70205, 'ready', 'cohara', 'week', 0, 1, 1539692099, 1539758703),
  (26737, 4, 2356458632, 70359, 'ready', 'cohara', 'week', 0, 1, 1539788309, 1539881103),
  (26738, 4, 2355888227, 70360, 'ready', 'cohara', 'week', 0, 1, 1539788311, 1539888303),
  (26748, 5, 2357496648, 70382, 'used', 'cohara', 'week', 0, 1, 1539804247, 1539805504),
  (26789, 5, 2358173104, 70478, 'ready', 'cohara', 'week', 0, 1, 1539871963, 1539873904),
  (26790, 5, 2358086314, 70479, 'ready', 'cohara', 'week', 0, 1, 1539871970, 1539877503),
  (26791, 5, 2358084471, 70480, 'ready', 'cohara', 'week', 0, 1, 1539871978, 1539881103);

REPLACE INTO `readitla_ril-tmp`.`tile_source`
  (tile_id, source_id, type, created_at, updated_at)
VALUES
  (24205, 23378, 'curated', '2018-09-11 13:45:02', '2018-09-11 13:45:02'),
  (24208, 23381, 'curated', '2018-09-11 14:45:01', '2018-09-11 14:45:01'),
  (24210, 23383, 'curated', '2018-09-11 15:45:02', '2018-09-11 15:45:02'),
  (26536, 25542, 'curated', '2018-10-16 19:45:03', '2018-10-16 19:45:03'),
  (26541, 25547, 'curated', '2018-10-16 21:45:03', '2018-10-16 21:45:03'),
  (26546, 25552, 'curated', '2018-10-16 23:45:02', '2018-10-16 23:45:02'),
  (26551, 25557, 'curated', '2018-10-17 01:45:03', '2018-10-17 01:45:03'),
  (26587, 25593, 'curated', '2018-10-17 14:45:04', '2018-10-17 14:45:04'),
  (26639, 25642, 'curated', '2018-10-18 09:45:04', '2018-10-18 09:45:04'),
  (26642, 25645, 'curated', '2018-10-18 10:45:03', '2018-10-18 10:45:03'),
  (26645, 25648, 'curated', '2018-10-18 11:45:03', '2018-10-18 11:45:03'),
  (26646, 25649, 'curated', '2018-10-18 11:45:03', '2018-10-18 11:45:03'),
  (26651, 25654, 'curated', '2018-10-18 13:45:03', '2018-10-18 13:45:03');

/* spam recs */

REPLACE INTO `readitla_ril-tmp`.projectx_posted_items
  (user_id, item_id, feed_item_id, original_post_id, comment, quote, time_shared, api_id, status)
VALUES
  (@user_id, 1653422551, '38449501-3d74-4624-9e0e-fef320088a1f', 0, 'this is a spam comment', null, UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1808422207, '92b45a7d-9aa8-442c-90a9-aed3b10d08bc', 0, 'more spam. ', null, UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1514732753, 'd5fd2503-d7a5-4f40-be75-743b7f0409f5', 0, null, null, UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 772045939, '654ededf-707e-4e69-981d-24b3d3edf7ba', 0, null, null, UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 1748259901, '26b91c10-4216-4e03-88b4-d2893d3d816d', 0, null, '------', UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 1748259901, 'c76f6968-3362-4862-a37e-0ef64b0820e3', 0, '------', null, UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1514732753, 'eccb288c-4174-47ae-b48c-af3faf84c03b', 0, 'love it', 'waaaaa', UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1808422207, '11d41778-f70d-4473-9d30-f906e7a66278', 0, 'I did. ', null, UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 1653422551, 'fceb5451-f74b-49c2-b9e8-071252d3ff4d', 0, null, null, UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 1653422551, 'ba0edee0-6a3a-4db6-a172-dc853ec1e95d', 0, null, null, UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1653422551, '38449501-3d74-4624-9e0e-fef320088a1f', 0, 'this is a spam comment', null, UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1808422207, '92b45a7d-9aa8-442c-90a9-aed3b10d08bc', 0, 'more spam. ', null, UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1514732753, 'd5fd2503-d7a5-4f40-be75-743b7f0409f5', 0, null, null, UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 772045939, '654ededf-707e-4e69-981d-24b3d3edf7ba', 0, null, null, UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 1748259901, '26b91c10-4216-4e03-88b4-d2893d3d816d', 0, null, '------', UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 1748259901, 'c76f6968-3362-4862-a37e-0ef64b0820e3', 0, '------', null, UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1514732753, 'eccb288c-4174-47ae-b48c-af3faf84c03b', 0, 'love it', 'waaaaa', UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1808422207, '11d41778-f70d-4473-9d30-f906e7a66278', 0, 'I did. ', null, UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 1653422551, 'fceb5451-f74b-49c2-b9e8-071252d3ff4d', 0, null, null, UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 1653422551, 'ba0edee0-6a3a-4db6-a172-dc853ec1e95d', 0, null, null, UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1653422551, '38449501-3d74-4624-9e0e-fef320088a1f', 0, 'this is a spam comment', null, UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1808422207, '92b45a7d-9aa8-442c-90a9-aed3b10d08bc', 0, 'more spam. ', null, UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1514732753, 'd5fd2503-d7a5-4f40-be75-743b7f0409f5', 0, null, null, UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 772045939, '654ededf-707e-4e69-981d-24b3d3edf7ba', 0, null, null, UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 1748259901, '26b91c10-4216-4e03-88b4-d2893d3d816d', 0, null, '------', UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 1748259901, 'c76f6968-3362-4862-a37e-0ef64b0820e3', 0, '------', null, UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1514732753, 'eccb288c-4174-47ae-b48c-af3faf84c03b', 0, 'love it', 'waaaaa', UNIX_TIMESTAMP(), 5512, 1),
  (@user_id, 1808422207, '11d41778-f70d-4473-9d30-f906e7a66278', 0, 'I did. ', null, UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 1653422551, 'fceb5451-f74b-49c2-b9e8-071252d3ff4d', 0, null, null, UNIX_TIMESTAMP(), 5512, 1),
  (@other_user_id, 1653422551, 'ba0edee0-6a3a-4db6-a172-dc853ec1e95d', 0, null, null, UNIX_TIMESTAMP(), 5512, 1),
  (23219660, 2136231202, '2120c772-191e-49e8-9820-b0cfa844123a', 0, null, 'To make a conscious AI, Christof Koch speculates, would require a different computer architecture with feedback mechanisms that promote information integration, such as a neuromorphic computer.', 1523298676, 0, 1),
  (23219660, 2142120324, '7cac5822-0033-4a37-88e8-e6509ca3cf2f', 0, 'Powerful article. What hit me was that courts forbid cellphones, without making any accommodations for people arriving by bus, who have no way to secure their cellphone.', null, 1523299840, 0, 1);

REPLACE INTO `readitla_ril-tmp`.admin_acl (user_id, context, role)
VALUES
  (@user_id, '*', '*'),
  (@premium_user_id, '*', '*'),
  (@old_premium_user_id, '*', '*');

REPLACE INTO `readitla_ril-tmp`.admin_users (user_id, pkt_user_id, ldap_id, created_at, updated_at, expires_at, status, fname, lname)
VALUES
	(1, 0, 'ad|Mozilla-LDAP|foobar', '2018-03-24 23:07:41', '2018-04-13 18:00:48', NULL, 1, NULL, NULL);


REPLACE INTO `readitla_ril-tmp`.admin_roles (`id`, `role`)
VALUES
	(1, '*'),
	(5, 'admin:bakery'),
	(2, 'admin:pockethits_email'),
	(3, 'admin:publisher'),
	(4, 'admin:support');

REPLACE INTO `readitla_ril-tmp`.admin_roles_users (role_id, user_id, permission, type, created_at, updated_at, expires_at)
VALUES
	(1, 1, '*', 1, '2018-09-25 06:45:12', '2018-09-25 06:45:12', NULL),
	(2, 1, '*', 1, '2018-09-25 06:45:13', '2018-09-25 06:45:13', NULL),
	(3, 1, '*', 1, '2018-09-25 06:45:13', '2018-09-25 06:45:13', NULL),
	(4, 1, '*', 1, '2018-09-25 06:45:13', '2018-09-25 06:45:13', NULL),
	(5, 1, '*', 1, '2018-09-25 06:45:13', '2018-09-25 06:45:13', NULL);

REPLACE INTO ab_tests (name, ab_test_type_id, population_pct, time_created, active) VALUES ('web_tryitnow_v1', 15, 100, UNIX_TIMESTAMP(), 1);
SET @id = (SELECT LAST_INSERT_ID());
REPLACE INTO ab_test_options (ab_test_id, name, weight) VALUES
  (@id, 'control', 33),
  (@id, 'firefox_learnmore', 33),
  (@id, 'plain_signup', 33);


REPLACE INTO ab_tests (name, ab_test_type_id, population_pct, time_created, active) VALUES ('web_firefox_learnmore', 15, 100, UNIX_TIMESTAMP(), 1);
SET @id = (SELECT LAST_INSERT_ID());
REPLACE INTO ab_test_options (ab_test_id, name, weight) VALUES
  (@id, 'firefox_learnmore_v1', 50),
  (@id, 'firefox_learnmore_v2', 50);

REPLACE INTO eoy_2017_user_summary (user_id, user_slug, top_percentile, open_cnt, article_cnt, article_word_cnt, est_word_cnt, popular_ind)
VALUES
  (@user_id, '4dedecd9a8', 5, 265, 197, 849487, 1004881, 0),
  (@other_user_id, '4dedecd9a7', 5, 265, 197, 849487, 1004881, 0);

REPLACE INTO eoy_2017_user_topics (user_id, grouping_id, topic_name, score)
VALUES
  (@user_id, 229146995, 'politics', 15.305),
  (@user_id, 229147017, 'technology', 10.862),
  (@user_id, 229147046, 'health', 3.477),
  (@user_id, 229147309, 'science', 7.663),
  (@user_id, 229147608, 'space', 3.662),
  (@other_user_id, 229146995, 'politics', 15.305);

REPLACE INTO eoy_2017_user_items (user_id, resolved_id, sorting_score)
VALUES
  (@user_id, 2136231202, 15.305),
  (@user_id, 2137233325, 14.305),
  (@user_id, 2138431914, 13.305),
  (@user_id, 2142120324, 12.305),
  (@user_id, 2142165945, 11.305),
  (@user_id, 2313275150, 10.305),
  (@user_id, 2316457532, 9.305),
  (@other_user_id, 2316457532, 9.305);

REPLACE INTO eoy_2018_topics (grouping_id, grouping_name, display_name, file_name, url_slug)
VALUES
  (229146984, 'football', 'Football', 'EOY2014_football.png', 'football'),
  (229146986, 'sports', 'Sports', 'EOY2014_sports.png', 'sports'),
  (229146992, 'books', 'Books', 'EOY2014_books.png', 'books'),
  (229146995, 'politics', 'Current Events', 'EOY2014_politics.png', 'current+events'),
  (229146998, 'soccer', 'Soccer', 'EOY2014_soccer.png', 'soccer'),
  (229146999, 'education', 'Education', 'EOY2014_education.png', 'education'),
  (229147000, 'business', 'Business', 'EOY2014_business.png', 'business'),
  (229147002, 'career', 'Career', 'EOY2014_career.png', 'career'),
  (229147006, 'photography', 'Photography', 'EOY2014_photography.png', 'photography'),
  (229147012, 'design', 'Design', 'EOY2014_design.png', 'design'),
  (229147015, 'music', 'Music', 'EOY2014_music.png', 'music'),
  (229147017, 'technology', 'Technology', 'EOY2014_technology.png', 'technology'),
  (229147046, 'health', 'Health', 'EOY2014_health.png', 'health'),
  (229147167, 'food', 'Food & Dining', 'EOY2014_food.png', 'food'),
  (229147169, 'fitness', 'Fitness', 'EOY2014_fitness.png', 'fitness'),
  (229147181, 'gender', 'Gender', 'EOY2014_gender.png', 'gender'),
  (229147200, 'recipes', 'Recipes', 'EOY2014_recipes.png', 'recipes'),
  (229147204, 'cars', 'Cars', 'EOY2014_cars.png', 'cars'),
  (229147252, 'travel', 'Travel', 'EOY2014_travel.png', 'travel'),
  (229147291, 'history', 'History', 'EOY2014_history.png', 'history'),
  (229147309, 'science', 'Science', 'EOY2014_science.png', 'science'),
  (229147318, 'security', 'Security', 'EOY2014_security.png', 'security'),
  (229147322, 'productivity', 'Productivity', 'EOY2014_productivity.png', 'productivity'),
  (229147398, 'programming', 'Programming', 'EOY2014_programming.png', 'programming'),
  (229147526, 'psychology', 'Psychology', 'EOY2014_psychology.png', 'psychology'),
  (229147530, 'finance', 'Finance', 'EOY2014_finance.png', 'finance'),
  (229147608, 'space', 'Space', 'EOY2014_space.png', 'space'),
  (229147655, 'religion', 'Religion', 'EOY2014_religion.png', 'religion'),
  (229147709, 'movies', 'Movies', 'EOY2014_movies.png', 'movies'),
  (229147710, 'games', 'Games', 'EOY2014_games.png', 'gaming'),
  (229147759, 'parenting', 'Parenting', 'EOY2014_parenting.png', 'parenting'),
  (229147911, 'basketball', 'Basketball', 'EOY2014_basketball.png', 'basketball'),
  (229148065, 'art', 'Art', 'EOY2014_art.png', 'art'),
  (229148148, 'baseball', 'Baseball', 'EOY2014_baseball.png', 'baseball'),
  (229148184, 'home', 'Home', 'EOY2014_home.png', 'home'),
  (229148185, 'diy', 'DIY & Crafts', 'EOY2014_diy.png', 'diy'),
  (229148402, 'fashion', 'Fashion', 'EOY2014_fashion.png', 'fashion'),
  (229148700, 'entertainment', 'Entertainment', 'EOY2014_entertainment.png', 'entertainment'),
  (229150836, 'relationships', 'Relationships', 'EOY2014_relationships.png', 'relationships'),
  (229150979, 'leadership', 'Leadership', 'EOY2014_leadership.png', 'leadership'),
  (229193228, 'startups', 'Startups', 'EOY2014_startups.png', 'startups');


REPLACE INTO `readitla_ril-tmp`.`apps_cats_assignments`
  (api_id, cat_id, sort)
VALUES
  (0, 0, 0.00),
  (1, 3, 2.00),
  (661, 5, 99819690.00),
  (8775, 5, 1.00),
  (1, 6, 0.00),
  (7035, 7, 1.00),
  (2, 9, 0.00),
  (1456, 10, 1.00),
  (0, 11, 1.00),
  (1, 13, 0.00),
  (1456, 13, 1.00),
  (2, 13, 1.00),
  (661, 13, 99819690.00),
  (8775, 13, 2.00),
  (1, 14, 1.00),
  (1456, 15, 0.00),
  (2, 15, 1.00),
  ('op_rand', 16, 0.00),
  (9346, 17, 1.00),
  (2, 23, 0.00),
  (17, 25, 1.00);

REPLACE INTO `readitla_ril-tmp`.`apps_cats`
  (cat_id, main_cat, name, slug, sort)
VALUES
  (1, 1, 'Twitter', 'twitter', 1),
  (2, 1, 'News / RSS', 'news', 2),
  (3, 1, 'Google Reader', 'google-reader', 3),
  (4, 1, 'Reading', 'reading', 5),
  (5, 2, 'Desktop', 'desktop', 5),
  (6, 2, 'Firefox', 'firefox', 6),
  (7, 2, 'Chrome', 'chrome', 7),
  (8, 2, 'Web Based', 'web', 8),
  (9, 3, 'iPhone', 'iphone', 9),
  (10, 3, 'Android', 'android', 10),
  (11, 3, 'Blackberry', 'blackberry', 11),
  (12, 3, 'Others', 'others', 12),
  (13, 1, 'Clients', 'clients', 0),
  (14, 0, 'Computer', 'computer', 0),
  (15, 0, 'Mobile', 'mobile', 1),
  (16, 2, 'Opera', 'opera', 0),
  (17, 2, 'Safari', 'safari', 0),
  (18, 2, 'Internet Explorer', 'internet-explorer', 0),
  (19, 0, 'WebOS', 'webos', 0),
  (20, 1, 'Bookmarks', 'bookmarks', 6),
  (21, 3, 'eBook Readers', 'ebooks', 11),
  (22, 3, 'S60', 's60', 13),
  (23, 3, 'iPad', 'ipad', 9),
  (24, 3, 'Windows Phone', 'windowsphone', 11),
  (25, 0, 'Email', 'email', 0),
  (26, 0, 'Other', 'other', 0),
  (27, 0, 'Browsers', 'browsers', 0);

REPLACE INTO `readitla_ril-tmp`.`api_platform`
  (platform_id, name)
VALUES
  (1, 'iPhone'),
  (2, 'iPad'),
  (3, 'Mac'),
  (4, 'Android - Mobile'),
  (5, 'Android - Tablet'),
  (6, 'Extension'),
  (7, 'Windows - Mobile'),
  (8, 'Windows - Desktop'),
  (9, 'Web'),
  (10, 'Mobile (other)'),
  (11, 'Desktop (other)');

REPLACE INTO `readitla_ril-tmp`.`api_category_assignment`
  (consumer_key, category_id, sort)
values
  ('16229-8f46f5238ec7b07e2c0f2fcf', 5, 0.00),
  ('28727-f116424d9afcf2d740c05f0b', 10, 0.00),
  ('28728-642c928305508057444d45c2', 10, 0.00),
  ('29191-4b11151a8a564888c12e5bbb', 5, 0.00),
  ('43508-995cd322edc190744c0aa4e8', 10, 0.00),
  ('43509-0af37a7d8d192c5b6d18d70a', 10, 0.00),
  ('49218-f3ea3b0a94cf693105493291', 13, 0.00),
  ('53340-34a5789c89f268f13a90cf08', 8, 0.00),
  ('64982-8aa7ba2d1392fdba45c7aa05', 10, 0.00),
  ('64983-fc0aed80c56d8731de470b87', 10, 0.00),
  ('70018-0949787950687c2d993016db', 5, 0.00),
  ('70018-49f9448379bd7bea1fabfac4', 8, 0.00),
  ('70018-90591d529cca106dd371dc55', 9, 0.00),
  ('70018-98f6c1073cfa07b072c01eb2', 5, 0.00),
  ('70018-c5cc75c6ec122925fa3c4542', 5, 0.00),
  ('70018-db6f97fcde3b90090ba0607d', 10, 0.00),
  ('70018-dbec0be2354334c84c83e24b', 23, 0.00),
  ('70018-ec1ec6bd90ff9c7742743e8e', 10, 0.00),
  ('70018-efe6fc7510b63189a0020390', 24, 0.00),
  ('78809-9423d8c743a58f62b23ee85c', 8, 0.00);

insert ignore into`readitla_ril-tmp`.`users_meta_properties`
(property_id, name)
values
(1, 'Instapaper user'),
(2, 'Instapaper Export'),
(3, 'Exported'),
(4, 'C2DM Reg Id DEPRECATED'),
(5, 'Android verification - apk size'),
(6, 'Android verification - stack trace'),
(7, 'Android Beta Download'),
(8, 'Android License Response'),
(9, 'Android upsell in unread'),
(10, 'Go - Sent'),
(11, 'Go - Clicked'),
(12, 'Opened Web App'),
(13, 'Facebook Token'),
(14, 'FB:OG:Save'),
(15, 'FB:OG:Read'),
(16, 'FB:OG:Favorite'),
(17, 'User Account Deleted'),
(18, 'Last Tag Update Time'),
(19, 'Pocket GS - Browser Setup - Sent'),
(20, 'Pocket GS - Bookmarklet - Sent'),
(21, 'Pocket HTA - Browser Setup - Sent'),
(22, 'Email Unsubscribe'),
(23, 'Email Bounce'),
(24, 'C2DM Reg Id DEPRECATED'),
(25, 'C2DM Registration Id'),
(26, 'Adroll Source'),
(27, 'Adroll Landing Page'),
(28, 'User List Cleared'),
(29, 'Spool Import'),
(30, 'Auto complete emails updated time'),
(31, 'Password reset counter'),
(32, 'Previous Username'),
(33, 'Previous Email'),
(34, 'Viewed Mac Upsell on Web'),
(35, 'Changelog page view'),
(36, 'Bookmarklet Tag hash'),
(37, 'CSRF Token'),
(38, 'Last time settings updated'),
(39, 'Get Extension - Sent'),
(40, 'Get Extension - Clicked'),
(41, 'Last time user account updated'),
(42, 'Was sent confirmation on signup'),
(43, 'Last time unconfirmed pending shares were updated'),
(44, 'Pocket Hits Unsubscribe'),
(45, 'Web GSF Settings'),
(46, 'Web Display Settings'),
(47, 'Last time rediscovery was updated'),
(48, 'One-time use create password'),
(49, 'Gender'),
(50, 'SSO Sign Up Type'),
(51, 'Bookmarklet Temp Login Token'),
(52, 'Extension Temp Login Token'),
(53, 'Last time recent searches was updated'),
(54, 'Springpad Import'),
(55, 'Last time web settings updated'),
(56, 'Collections Access'),
(57, 'Has logged into web app'),
(58, 'Twitter Credentials for Collections'),
(59, 'Browser Bookmark Import'),
(60, 'Max Feed Id (Project X)'),
(61, 'Web App Beta Invite Status'),
(62, 'Last time notifications was updated'),
(63, 'White list status for third party analytics'),
(64, 'Recommendations Beta Invite Status'),
(65, 'Last time user recommendations processed'),
(66, 'iOS Beta Access'),
(67, 'Last time recent friends updated'),
(68, 'Last time social tokens updated'),
(69, 'Last time feed accessed'),
(71, 'HAS_POSTED_ATLEAST_ONCE'),
(72, 'Has Accessed Mobile Beta'),
(73, 'Last time notification added'),
(74, 'First time using Pocket 6.1+'),
(75, 'Is Pocket Test Account'),
(76, 'Backfill STF to Notification Complete'),
(77, 'USERS_META_IMPORTED_CONTACTS'),
(78, 'POCKET ALPHA USER'),
(79, 'EOY 2015 Network Type'),
(80, 'In-app Sponsor Last Viewed'),
(81, 'First time using Pocket 6.3+'),
(82, 'Is Pocket Influencer'),
(83, 'Is Pocket Team Account'),
(84, 'Share Reported For Spam'),
(85, 'Is Pocket Ghost Account'),
(86, 'Is Upgraded Pocket Ghost Account'),
(87, 'Is Pocket Hits Ghost Account'),
(88, 'Is Upgraded Pocket Hits Ghost Account'),
(89, 'EOY 2016 Network Type'),
(90, 'Is User Blacklisted'),
(91, 'Last time favorite changed'),
(92, 'Last time archive changed'),
(93, 'Last time highlight changed'),
(94, 'Web App Beta Status'),
(95, 'EOY 2017 Network Type'),
(96, 'EOY 2018 Network Type'),
(97, 'Payment Flow Version'),
(98, 'Last Web Release Notes');

REPLACE INTO `readitla_ril-tmp`.`apps`
  (api_id, api_id_shared, name, slug, download_url, type, `desc`, desc_ril, status)
values
  (0, 0, 'addToReadingList', 'addtoreadinglist', 'https://sites.google.com/site/addtoreadinglist/', 'Blackberry App', 'Addtoreadinglist is a Blackberry browser integrated client for the ReadItLater service.  It was built on RIM OS 4.5, so it will definitely work on devices with version 4.5 of the OS installed and should work on devices with a later version of the OS installed.', '- Save links to Read It Later', 1),
  (1, 1, 'Pocket Firefox Extension', 'firefox', 'https://addons.mozilla.org/en-US/firefox/addon/read-it-later/', 'Firefox Extension', '', '', 2),
  (1456, 1456, 'Pocket Android App', '', 'http://getpocket.com/apps/link/pocket-android/?s=APP_DIRECTORY', 'Android App', '', '', 2),
  (17, 17, 'Email', '', 'http://readitlaterlist.com/email', 'Email Support', 'Email links directly to Read It Later.', 'Email links to your reading list', 2),
  (2, 2, 'Pocket iPhone/iPad App', '', 'http://getpocket.com/apps/link/pocket-iphone/?s=APP_DIRECTORY', 'iPhone/iPad App', '', '', 2),
  (5512, 5512, 'Pocket iPhone', 'pocket-iphone', 'http://itunes.apple.com/app/read-it-later-pro/id309601447?mt=8', 'iPhone App', '', '', 0),
  (5513, 5513, 'Pocket Android', 'pocket-android', 'https://play.google.com/store/apps/details?id=com.ideashower.readitlater.pro', 'Android App', '', '', 0),
  (5514, 5514, 'Pocket Android In-App', 'pocket-android-market', 'market://details?id=com.ideashower.readitlater.pro', 'Android App', '', '', 0),
  (5515, 5515, 'Pocket Amazon', 'pocket-amazon', 'http://www.amazon.com/gp/mas/dl/android?p=com.ideashower.readitlater.pro', 'Amazon App', '', '', 0),
  (661, 661, 'Read Now', 'readnow', 'http://mischneider.net/?page_id=180', 'Mac App', 'ReadNow is a little application that sits on the menubar and uses the Read It Later API to communicate to Read It Later. Currently it is a very early version developed as a learning project from Michael Schneider.

Some functions of ReadNow:

    * Add new sites per dragging the url on the menubar icon
    * Searching for sites
    * Keyboard shortcuts
    * Switch between unread and read sites
    * Global shortcut to open ReadNow
    * Open URLs in background
    * Mark sites read
    * Copy the URL of a site
    * Sort sides latest added or newest added first
', 'Access Read It Later from your Mac desktop', 0),
  (8775, 8775, 'Pocket for Mac', 'pocket-mac', 'https://itunes.apple.com/app/pocket/id568494494?ls=1&mt=12', 'Mac App', '', '', 2),
  (9348, 9348, 'Pocket Chrome App', 'pocket-chrome-app', 'https://chrome.google.com/webstore/detail/jijgclgmgjipgefcnnnibgllfonlfdap', 'Chrome Web App', '', '', 0),
  ('op_rand', 0, 'Pocket for Opera', 'opera_random', 'https://addons.opera.com/en/extensions/details/pocket-formerly-read-it-later/', 'Extension', '', 'Installing the Pocket browser extension installs buttons that let you save items with one click.', 2);

insert ignore into`readitla_ril-tmp`.`subscriptions`
(subscription_id, subscription_source, subscription_type, name, source_id, amount, display_amount, fee, currency, trial_period_days, status, livemode, version_key, usd_amount)
values
(300, 3, 1, 'Pocket Premium - Monthly', 'stripe.test.usd.1mo', 499, '$4.99', 0, 'USD', 0, 1, 0, null, 499),
(301, 3, 2, 'Pocket Premium - Annual', 'stripe.test.usd.1yr', 4499, '$44.99', 0, 'USD', 0, 1, 0, null, 4499),
(302, 3, 1, 'Pocket Premium - Monthly', 'stripe.test.jpy.1mo', 50000, '¥500', 0, 'JPY', 0, 1, 0, null, 499),
(303, 3, 2, 'Pocket Premium - Annual', 'stripe.test.jpy.1yr', 450000, '¥4,500', 0, 'JPY', 0, 1, 0, null, 4499),
(1000, 1, 1, 'Pocket Premium - Monthly', 'pocket.premium.1mo', 499, '$4.99', 149, 'USD', 0, 1, 1, null, 499),
(1001, 1, 2, 'Pocket Premium - Annual', 'pocket.premium.1yr', 4499, '$44.99', 1349, 'USD', 1, 1, 0, null, 4499),
(200, 2, 1, 'Pocket Premium - Monthly', 'pocket.test.1mo', 499, '$4.99', 150, 'USD', 0, 1, 0, null, 499),
(201, 2, 2, 'Pocket Premium - Annual', 'pocket.test.1yr', 4499, '$44.99', 1350, 'USD', 0, 1, 0, null, 4499),
(2000, 2, 1, 'Pocket Premium - Monthly', 'pocket.premium.1month', 499, '$4.99', 150, 'USD', 0, 1, 1, null, 499),
(2001, 2, 2, 'Pocket Premium - Annual', 'pocket.premium.1year', 4499, '$44.99', 1350, 'USD', 0, 1, 1, null, 4499),
(2002, 2, 2, 'Pocket Premium - Annual', 'pocket.premium.1year.v2', 4499, '$44.99', 1350, 'USD', 0, 1, 1, null, 4499),
(2003, 2, 2, 'Pocket Premium - Annual', 'pocket.premium.1year.v3', 4499, '$44.99', 1350, 'USD', 0, 1, 1, null, 4499),
(2004, 2, 1, 'Pocket Ad Free - Monthly', 'pocket.premium.adfree.1month.v1', 99, '$0.99', 30, 'USD', 0, 1, 1, null, 99),
(2005, 2, 2, 'Pocket Ad Free - Annual', 'pocket.premium.adfree.1year.v1', 999, '$9.99', 300, 'USD', 0, 1, 1, null, 999),
(2006, 2, 1, 'Pocket Premium - Monthly', 'pocket.premium.1month.v3', 499, '$4.99', 150, 'USD', 0, 1, 1, null, 499);

REPLACE INTO `readitla_ril-tmp`.`user_subscription`
(source_id, user_id, subscription_id, coupon_id, purchase_date, renew_date, cancel_date, status, amount_per_period, currency, is_primary, livemode)
values
('sub_blah', @old_premium_user_id, 300, 0, 1400783888, 1400783888, 0, 1, 499, 'USD', 1, 0);

REPLACE INTO `readitla_ril-tmp`.`payment_products`
  (store, vendor_id, account_id, test_mode)
values
  ('stripe', 'prod_ERM8OT1OZtRS5w', 'pocket_playground', 1);
SET @product_id = (SELECT LAST_INSERT_ID());


REPLACE INTO `readitla_ril-tmp`.`payment_subscriptions`
(product_id, vendor_id, user_id)
values
(@product_id, 'sub_EUNCE6WTv0qfe2', @premium_user_id);


REPLACE INTO `readitla_ril-tmp`.`payment_products`
(store, vendor_id, account_id, test_mode, product_interval)
values
('ios', 'pocket.premium.1mo', 'com.ideashower.ReadItLaterPro', 0, 'month'),
('ios', 'pocket.premium.1yr', 'com.ideashower.ReadItLaterPro', 0, 'year'),
('ios', 'pocket.premium.1mo.alpha', 'com.ideashower.ReadItLaterProAlphaNeue', 1, 'month'),
('ios', 'pocket.premium.1yr.alpha', 'com.ideashower.ReadItLaterProAlphaNeue', 1, 'year');

REPLACE INTO `readitla_ril-tmp`.`payment_products`
(store, vendor_id, account_id, test_mode, product_interval)
values
('google', 'pocket.test.1mo', 'com.ideashower.readitlater.pro', 1, 'month'),
('google', 'pocket.test.1yr', 'com.ideashower.readitlater.pro', 1, 'year'),
('google', 'pocket.premium.1month', 'com.ideashower.readitlater.pro', 0, 'month'),
('google', 'pocket.premium.1year', 'com.ideashower.readitlater.pro', 0, 'year'),
('google', 'pocket.premium.1year.v2', 'com.ideashower.readitlater.pro', 0, 'year'),
('google', 'pocket.premium.1year.v3', 'ccom.ideashower.readitlater.pro', 0, 'year'),
('google', 'pocket.premium.adfree.1month.v1', 'com.ideashower.readitlater.pro', 0, 'month'),
('google', 'pocket.premium.adfree.1year.v1', 'com.ideashower.readitlater.pro', 0, 'year'),
('google', 'pocket.premium.1month.v3', 'com.ideashower.readitlater.pro', 0, 'month');

  insert ignore into`readitla_ril-tmp`.`subscription_type`
(id, name)
values
(1, 'monthly'),
(2, 'annual'),
(3, 'comped');

insert ignore into`readitla_ril-tmp`.`subscription_source`
(id, name)
values
(1, 'itunes'),
(2, 'googleplay'),
(3, 'web'),
(4, 'pocket manual');


REPLACE INTO `spoc_campaigns` (`id`, `user_id`, `type_id`, `profile`, `company`, `name`, `url`, `date_start`, `date_end`, `budget`, `targets`, `placements`, `creatives`, `notes`, `status`, `extra_info`, `created_at`, `updated_at`, `targeting_profile`, `content_url`)
VALUES
	(1, 0, 0, '', 'ff.variant_settings', 'default', '', '2019-03-22 22:33:28', '0000-00-00 00:00:00', '', '', '', '', '', 1, '{\"settings\":{\"domainAffinityParameterSets\":{\"default\":{\"recencyFactor\":0.5,\"frequencyFactor\":0.5,\"combinedDomainFactor\":0.5,\"perfectFrequencyVisits\":10,\"perfectCombinedDomainScore\":2,\"multiDomainBoost\":0,\"itemScoreFactor\":1},\"fully-personalized\":{\"recencyFactor\":0.5,\"frequencyFactor\":0.5,\"combinedDomainFactor\":0.5,\"perfectFrequencyVisits\":10,\"perfectCombinedDomainScore\":2,\"multiDomainBoost\":0,\"itemScoreFactor\":0.01}},\"timeSegments\":[{\"id\":\"week\",\"startTime\":604800,\"endTime\":0,\"weightPosition\":1},{\"id\":\"month\",\"startTime\":2592000,\"endTime\":604800,\"weightPosition\":0.5}],\"spocsPerNewTabs\":10,\"recsExpireTime\":5400,\"version\":\"3279ebdc0607ed34f8bb7ab8281d2926cd5a351f\"}}', '2019-03-22 22:33:28', '2019-03-22 22:33:28', NULL, NULL),
	(2, 0, 2, 'default', 'Domain1', 'personalized', 'domain1', '2020-01-01 00:00:00', '2020-01-01 23:59:00', '{\"rate\":1,\"metric\":\"CPM\",\"cap\":1000,\"amount\":1}', '', '', '[{\"title\":\"Creative 1a\",\"image_url\":\"https:\\/\\/img-getpocket.cdn.mozilla.net\\/direct?url=https%3A%2F%2Fhips.hearstapps.com%2Fhmg-prod.s3.amazonaws.com%2Fimages%2Fgettyimages-1131134931-copy-1553024951.jpg%3Fcrop%3D1.00xw%3A0.334xh%3B0%2C0.264xh%26resize%3D1200%3A%2A&resize=w450\",\"url\":\"http:\\/\\/www.content?variant=1\",\"uuid\":\"b1311454711ed4b395bcf47e9f86fd71\"}]', '', 1, '{\"@pacing.config\":\"ff_sample_pacing\"}', '2019-03-22 22:36:14', '2019-03-22 22:38:51', '', 'http://www.content'),
	(3, 0, 2, 'default', 'Domain1', 'personalized', 'domain1', '2020-01-01 00:00:00', '2020-01-01 23:59:00', '{\"rate\":1,\"metric\":\"CPM\",\"cap\":1000,\"amount\":1}', '', '', '[{\"title\":\"Creative 1b\",\"image_url\":\"https:\\/\\/img-getpocket.cdn.mozilla.net\\/direct?url=https%3A%2F%2Fhips.hearstapps.com%2Fhmg-prod.s3.amazonaws.com%2Fimages%2Fgettyimages-1131134931-copy-1553024951.jpg%3Fcrop%3D1.00xw%3A0.334xh%3B0%2C0.264xh%26resize%3D1200%3A%2A&resize=w450\",\"url\":\"http:\\/\\/www.content?variant=2\",\"uuid\":\"b1311454711ed4b395bcf47e9f86fd71\"}]', '', 0, '{\"campaign_id\":2,\"@pacing.config\":\"ff_sample_pacing\"}', '2019-03-22 22:36:28', '2019-03-22 22:39:01', '', 'http://www.content'),
	(4, 0, 2, 'default', 'Domain1', 'personalized', 'domain1', '2020-01-01 00:00:00', '2020-01-01 23:59:00', '{\"rate\":1,\"metric\":\"CPM\",\"cap\":1000,\"amount\":1}', '', '', '[{\"title\":\"Creative 2\",\"image_url\":\"https:\\/\\/img-getpocket.cdn.mozilla.net\\/direct?url=https%3A%2F%2Fhips.hearstapps.com%2Fhmg-prod.s3.amazonaws.com%2Fimages%2Fgettyimages-1131134931-copy-1553024951.jpg%3Fcrop%3D1.00xw%3A0.334xh%3B0%2C0.264xh%26resize%3D1200%3A%2A&resize=w450\",\"url\":\"http:\\/\\/www.content\\/2\",\"uuid\":\"b1311454711ed4b395bcf47e9f86fd71\"}]', '', 0, '{\"campaign_id\":2,\"@pacing.config\":\"ff_sample_pacing\"}', '2019-03-22 22:37:38', '2019-03-22 22:38:41', '', 'http://www.content/2'),
	(5, 0, 0, '', 'ff.variant_settings', 'ff_sample_pacing', '', '2019-03-22 22:41:27', '0000-00-00 00:00:00', '', '', '', '', '', 1, '{\"weights\":{\"2\":5},\"skip\":{\"4\":true}}', '2019-03-22 22:41:27', '2019-03-22 22:41:27', NULL, NULL);
REPLACE INTO `spoc_ff_creatives` (`source_id`, `campaign_id`, `title`, `url`, `item_id`, `tile_id`, `created_at`)
VALUES
	(2, 2, 'Creative 1a', 'http://www.content?variant=1', 0, 0, '2019-03-22 22:38:51'),
	(3, 2, 'Creative 1b', 'http://www.content?variant=2', 0, 0, '2019-03-22 22:39:01'),
	(4, 2, 'Creative 2', 'http://www.content/2', 0, 0, '2019-03-22 22:38:41');


INSERT IGNORE INTO `eoy_2018_topics` (`grouping_id`, `grouping_name`, `display_name`, `file_name`, `url_slug`)
VALUES
(229146984, 'football', 'Football', 'EOY2014_football.png', 'football+eoy'),
(229146986, 'sports', 'Sports', 'EOY2014_sports.png', 'sports'),
(229146992, 'books', 'Books', 'EOY2014_books.png', 'books'),
(229147655, 'religion', 'Religion', 'EOY2014_religion.png', 'religion'),
(1, 'fakedata', 'FakeData', 'EOY2014_religion.png', 'fakedata'),
(2, 'morefakedata', 'MoreFakeData', 'EOY2014_religion.png', 'morefakedata')
;

REPLACE INTO `eoy_2018_user_summary` (`user_id`, `user_slug`, `top_percentile`, `open_cnt`, `article_cnt`, `article_word_cnt`, `webpage_cnt`, `webpage_word_cnt`, `est_word_cnt`, `popular_ind`)
VALUES
(24060899, 'top1', 1, 1, 1, 1, 1, 1, 1, 1),
(24060900, 'top5', 5, 1, 1, 1, 1, 1, 1, 1),
(24060901, 'top10', 10, 1, 1, 1, 1, 1, 1, 1),
(24060902, 'top10alt', 10, 1, 1, 1, 1, 1, 1, 1);

REPLACE INTO `eoy_2018_user_items` (`user_id`, `resolved_id`, `sorting_score`)
VALUES
(24060899, 1460779530, 1.0000),
(24060899, 1514732753, 0.9000),
(24060899, 1653422551, 0.8000),
(24060900, 1748259901, 0.8000),
(24060900, 1808422207, 0.9000),
(24060900, 1460779530, 0.8000),
(24060901, 1514732753, 1.0000),
(24060901, 1653422551, 0.7500),
(24060901, 1748259901, 0.0750);

REPLACE INTO `eoy_2019_topics` (`grouping_id`, `grouping_name`, `display_name`, `file_name`, `url_slug`)
VALUES
(229146984, 'football', 'Football', 'EOY2014_football.png', 'football+eoy'),
(229146986, 'sports', 'Sports', 'EOY2014_sports.png', 'sports'),
(229146992, 'books', 'Books', 'EOY2014_books.png', 'books'),
(229147655, 'religion', 'Religion', 'EOY2014_religion.png', 'religion'),
(1, 'fakedata', 'FakeData', 'EOY2014_religion.png', 'fakedata'),
(2, 'morefakedata', 'MoreFakeData', 'EOY2014_religion.png', 'morefakedata')
;

REPLACE INTO `eoy_2019_user_summary` (`user_id`, `user_slug`, `top_percentile`, `open_cnt`, `article_cnt`, `article_word_cnt`, `webpage_cnt`, `webpage_word_cnt`, `est_word_cnt`, `popular_ind`)
VALUES
(24060899, 'top1', 1, 1, 1, 1, 1, 1, 1, 1),
(24060900, 'top5', 5, 1, 1, 1, 1, 1, 1, 1),
(24060901, 'top10', 10, 1, 1, 1, 1, 1, 1, 1),
(24060902, 'top10alt', 10, 1, 1, 1, 1, 1, 1, 1);

REPLACE INTO `eoy_2019_user_items` (`user_id`, `resolved_id`, `sorting_score`)
VALUES
(24060899, 1460779530, 1.0000),
(24060899, 1514732753, 0.9000),
(24060899, 1653422551, 0.8000),
(24060900, 1748259901, 0.8000),
(24060900, 1808422207, 0.9000),
(24060900, 1460779530, 0.8000),
(24060901, 1514732753, 1.0000),
(24060901, 1653422551, 0.7500),
(24060901, 1748259901, 0.0750);

REPLACE INTO `eoy_2019_user_topics` (`user_id`, `grouping_id`, `topic_name`, `score`)
VALUES
(24060899, 229146984, 'footbal', 0.500),
(24060899, 229146986, 'sports', 0.600),
(24060899, 229146992, 'books', 0.700),
(24060899, 229147655, 'religion', 0.800),
(24060900, 229146984, 'footbal', 0.500),
(24060900, 229146986, 'sports', 0.600),
(24060900, 229146992, 'books', 0.700),
(24060900, 229147655, 'religion', 0.800),
(24060900, 1, 'fakedata', 0.850),
(24060901, 229146984, 'footbal', 0.500),
(24060901, 229146986, 'sports', 0.600),
(24060901, 229146992, 'books', 0.700),
(24060902, 229146984, 'footbal', 0.500),
(24060902, 229146986, 'sports', 0.600);


## Pocket hits Prospects to populate the selector in the pocket hits tool
REPLACE INTO `readitla_ril-tmp`.`pocket_hits_prospects` (`content_id`, `type`, `headline`, `author`,`author_twitter`,`publication`,`publication_twitter`,`save_count`,`impact_score`,`long_link`,`publication_time`,`date_added`,`used`,`publisher_id`,`images`,`vid`,`word_count`)
VALUES
(1,'trending','How to Be a 10x Developer','Chelsea Troy','HeyChelseaTroy','chelseatroy.com','HeyChelseaTroy',2,1,'https://chelseatroy.com/2020/12/18/how-to-be-a-10x-developer/','2020-12-22 15:18:06','2020-12-22',false,1,'{}',1234567,1700);

-- User with a firefox account
REPLACE INTO `readitla_ril-tmp`.`user_firefox_account` (`user_id`, `firefox_access_token`, `firefox_uid`, `firefox_email`, `firefox_avatar`, `birth`, `api_id`, `active`)
VALUES
(@fx_user_id, '69a8d93e6c4e460599ce4c57c893c2a3', '69a8d93e6c4e460599ce4c57c893c2a3', 'vlad@dracula.com', '', '1999-12-31 23:59:59', 40249, 1);
