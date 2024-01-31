## [5.2.3](https://github.com/Pocket/terraform-modules/compare/v5.2.2...v5.2.3) (2024-01-24)


### Bug Fixes

* **stopTimeout:** adding in stop timeout options ([#1097](https://github.com/Pocket/terraform-modules/issues/1097)) ([2641cfe](https://github.com/Pocket/terraform-modules/commit/2641cfe0fe7971fa38e12925bc80c486c5183bec))

## [5.2.2](https://github.com/Pocket/terraform-modules/compare/v5.2.1...v5.2.2) (2024-01-16)


### Bug Fixes

* **deps:** update cdktf ([#1095](https://github.com/Pocket/terraform-modules/issues/1095)) ([f831bfa](https://github.com/Pocket/terraform-modules/commit/f831bfae16403937c2ccf1f7a6679f17756021b4))

## [5.2.1](https://github.com/Pocket/terraform-modules/compare/v5.2.0...v5.2.1) (2023-11-28)


### Bug Fixes

* **rds:** allowing a no name rds ([#1094](https://github.com/Pocket/terraform-modules/issues/1094)) ([8892837](https://github.com/Pocket/terraform-modules/commit/88928377bf1341866aea902a113edf72a8a67b04))

## [5.2.0](https://github.com/Pocket/terraform-modules/compare/v5.1.0...v5.2.0) (2023-11-17)


### Features

* trigger release ([9bd66c8](https://github.com/Pocket/terraform-modules/commit/9bd66c8b915bfa4fe526205748f8ef5dccbd96ef))

## [5.1.0](https://github.com/Pocket/terraform-modules/compare/v5.0.3...v5.1.0) (2023-07-28)


### Features

* **synchecks:** adding userId to CloudWatchSynthetics ([#1092](https://github.com/Pocket/terraform-modules/issues/1092)) ([e0bf64e](https://github.com/Pocket/terraform-modules/commit/e0bf64e93a731d4806147bd4907aa0a04cc9c63f))

## [5.0.3](https://github.com/Pocket/terraform-modules/compare/v5.0.2...v5.0.3) (2023-07-28)


### Reverts

* Revert "SOCIALPLAT-386: adding userId to PocketCloudWatchSynthetics" (#1090) ([4f9056d](https://github.com/Pocket/terraform-modules/commit/4f9056df1bb5f076d99e099d10f896f6f7247e64)), closes [#1090](https://github.com/Pocket/terraform-modules/issues/1090) [#1089](https://github.com/Pocket/terraform-modules/issues/1089)

## [5.0.2](https://github.com/Pocket/terraform-modules/compare/v5.0.1...v5.0.2) (2023-07-24)


### Bug Fixes

* **deps:** update cdktf ([#1087](https://github.com/Pocket/terraform-modules/issues/1087)) ([ac155e8](https://github.com/Pocket/terraform-modules/commit/ac155e82e9d26c4963f49ead7b40800b4776840e))

## [5.0.1](https://github.com/Pocket/terraform-modules/compare/v5.0.0...v5.0.1) (2023-07-24)


### Bug Fixes

* **deps:** update dependency @cdktf/provider-pagerduty to v9 ([#1086](https://github.com/Pocket/terraform-modules/issues/1086)) ([1c56273](https://github.com/Pocket/terraform-modules/commit/1c562731e851e9e0d0adb44708edd11a80021fc1))

## [4.17.1](https://github.com/Pocket/terraform-modules/compare/v4.17.0...v4.17.1) (2023-07-16)


### Bug Fixes

* **dependencies:** [INFRA-1356] Update 'parse-domain' package and pin dependencies ([#1084](https://github.com/Pocket/terraform-modules/issues/1084)) ([57a6b4f](https://github.com/Pocket/terraform-modules/commit/57a6b4fed1f2dd408033dc7d503f9b4e053e1eae))

## [4.17.0](https://github.com/Pocket/terraform-modules/compare/v4.16.2...v4.17.0) (2023-06-16)


### Features

* **synchecks:** use pocket/aws-synthetic-checks-managed zip file ([#1073](https://github.com/Pocket/terraform-modules/issues/1073)) ([66c2cfe](https://github.com/Pocket/terraform-modules/commit/66c2cfe5d91205baf1ee1403de7b45550d0f4cb7))

## [4.16.2](https://github.com/Pocket/terraform-modules/compare/v4.16.1...v4.16.2) (2023-06-09)


### Bug Fixes

* **deps:** update dependency @sinonjs/commons to v3 ([#1057](https://github.com/Pocket/terraform-modules/issues/1057)) ([10bf678](https://github.com/Pocket/terraform-modules/commit/10bf6785384f2f2d100e38f9e6a15e5ca52b3071))

## [4.16.1](https://github.com/Pocket/terraform-modules/compare/v4.16.0...v4.16.1) (2023-05-30)


### Bug Fixes

* **export:** forgot to expore aws synthetics work ([#1063](https://github.com/Pocket/terraform-modules/issues/1063)) ([ca668ae](https://github.com/Pocket/terraform-modules/commit/ca668aea36180bdd4e1db229947942bd443aed30))

## [4.16.0](https://github.com/Pocket/terraform-modules/compare/v4.15.0...v4.16.0) (2023-05-30)


### Features

* **aws synchecks:** add aws synthetics for inside vpc checks w/defaults ([227874c](https://github.com/Pocket/terraform-modules/commit/227874cfa58174242f00ea17f04f7079ba2a74e2))

## [4.15.0](https://github.com/Pocket/terraform-modules/compare/v4.14.0...v4.15.0) (2023-05-26)


### Features

* **logstream:** have ECS log stream prefix be configurable ([#1051](https://github.com/Pocket/terraform-modules/issues/1051)) ([353edd7](https://github.com/Pocket/terraform-modules/commit/353edd70f120d59fab6d09be6c60d2050b852c74))

## [4.14.0](https://github.com/Pocket/terraform-modules/compare/v4.13.1...v4.14.0) (2023-03-29)


### Features

* Allow passing in wafv2webacl and associate it with alb ([#1045](https://github.com/Pocket/terraform-modules/issues/1045)) ([4923c29](https://github.com/Pocket/terraform-modules/commit/4923c29a870dfd291ae23da98c3a1cbab2a231bc))

## [4.13.1](https://github.com/Pocket/terraform-modules/compare/v4.13.0...v4.13.1) (2023-03-24)


### Bug Fixes

* **policy principals:** more policies need more specific principle ([#1044](https://github.com/Pocket/terraform-modules/issues/1044)) ([3d845fb](https://github.com/Pocket/terraform-modules/commit/3d845fb0939e8731703e3cd7d5ae863943a978ae))

## [4.13.0](https://github.com/Pocket/terraform-modules/compare/v4.12.0...v4.13.0) (2023-03-23)


### Features

* **pagerduty:** extend pagerduty svc ack timeout period ([#1043](https://github.com/Pocket/terraform-modules/issues/1043)) ([3f974e0](https://github.com/Pocket/terraform-modules/commit/3f974e0ec7baa7b92b28bdf2665ca9b02ecb9b5c))

## [4.12.0](https://github.com/Pocket/terraform-modules/compare/v4.11.0...v4.12.0) (2023-03-15)


### Features

* **ECSContDef:** Adding ulimit interface to AppECSContDef ([#1040](https://github.com/Pocket/terraform-modules/issues/1040)) ([588ad98](https://github.com/Pocket/terraform-modules/commit/588ad98e93fad351803eb7b10568101a7a1a1e8a))

## [4.11.0](https://github.com/Pocket/terraform-modules/compare/v4.10.1...v4.11.0) (2023-03-08)


### Features

* **ECSContainer:** add datetime and multiline log options to ECS def. ([#1039](https://github.com/Pocket/terraform-modules/issues/1039)) ([3fcb65a](https://github.com/Pocket/terraform-modules/commit/3fcb65addb5b4c85800631dba5bb7c52dc750279))

## [4.10.1](https://github.com/Pocket/terraform-modules/compare/v4.10.0...v4.10.1) (2023-02-23)


### Bug Fixes

* **lambda perm:** api gateway lambda permission needs more specific principle ([#1037](https://github.com/Pocket/terraform-modules/issues/1037)) ([91ec1a2](https://github.com/Pocket/terraform-modules/commit/91ec1a22c13d25e1dcb33deb4d08d45b971be8f3))

## [4.10.0](https://github.com/Pocket/terraform-modules/compare/v4.9.2...v4.10.0) (2023-01-31)


### Features

* **security group:** add internal security group ([#1036](https://github.com/Pocket/terraform-modules/issues/1036)) ([30e201e](https://github.com/Pocket/terraform-modules/commit/30e201ed39b50d66b71b36a527d056aa4d5070c3))

## [4.9.2](https://github.com/Pocket/terraform-modules/compare/v4.9.1...v4.9.2) (2023-01-30)


### Bug Fixes

* additional principal identifiers needing 'codedeploy.' prepended. ([#1034](https://github.com/Pocket/terraform-modules/issues/1034)) ([1f26c21](https://github.com/Pocket/terraform-modules/commit/1f26c216b79f1e34ff2b544ec001e0d9084e7638))

## [4.9.1](https://github.com/Pocket/terraform-modules/compare/v4.9.0...v4.9.1) (2023-01-26)


### Bug Fixes

* Empty commit to force release ([#1033](https://github.com/Pocket/terraform-modules/issues/1033)) ([0f8b04b](https://github.com/Pocket/terraform-modules/commit/0f8b04b9707112bb31ae2cc59f18c2f14bfa7b4b))

## [4.9.0](https://github.com/Pocket/terraform-modules/compare/v4.8.1...v4.9.0) (2023-01-24)


### Features

* add prop to configure success termination timeout value ([#1031](https://github.com/Pocket/terraform-modules/issues/1031)) ([6223ac8](https://github.com/Pocket/terraform-modules/commit/6223ac85e4a2d8ad40d6685d5a9289089402dcb9))

## [4.8.1](https://github.com/Pocket/terraform-modules/compare/v4.8.0...v4.8.1) (2023-01-11)


### Bug Fixes

* **provider:** applying a missing provider ([#1029](https://github.com/Pocket/terraform-modules/issues/1029)) ([342536b](https://github.com/Pocket/terraform-modules/commit/342536bf730f863802c1913e877479677cdb18ea))

## [4.8.0](https://github.com/Pocket/terraform-modules/compare/v4.7.0...v4.8.0) (2023-01-10)


### Features

* **cdktf0.14:** upgrading cdktf to 0.14 ([#1028](https://github.com/Pocket/terraform-modules/issues/1028)) ([db0a7af](https://github.com/Pocket/terraform-modules/commit/db0a7af698287f56c918a4e395d825be58e1ce0a))

## [4.7.0](https://github.com/Pocket/terraform-modules/compare/v4.6.1...v4.7.0) (2023-01-10)


### Features

* **provider:** ensure the provider is propogated through ([#1027](https://github.com/Pocket/terraform-modules/issues/1027)) ([cadf570](https://github.com/Pocket/terraform-modules/commit/cadf5705fc201f2c90d7b3d7f87fe8a90d4683b1))

## [4.6.1](https://github.com/Pocket/terraform-modules/compare/v4.6.0...v4.6.1) (2023-01-06)


### Bug Fixes

* **alb:** fixing up mistake in alb logs ([#1025](https://github.com/Pocket/terraform-modules/issues/1025)) ([ac29708](https://github.com/Pocket/terraform-modules/commit/ac297087bb8ea437e5d7830a5f1f00a93832ff04))

## [4.6.0](https://github.com/Pocket/terraform-modules/compare/v4.5.2...v4.6.0) (2023-01-05)


### Features

* **accessLogs:** adding in access log to s3 support for ALBs ([#1024](https://github.com/Pocket/terraform-modules/issues/1024)) ([816781b](https://github.com/Pocket/terraform-modules/commit/816781b0041f21fc45a833b3c49d7c65b5db9deb))

## [4.5.2](https://github.com/Pocket/terraform-modules/compare/v4.5.1...v4.5.2) (2023-01-04)


### Bug Fixes

* missing efs policy action ([#1022](https://github.com/Pocket/terraform-modules/issues/1022)) ([1183ae9](https://github.com/Pocket/terraform-modules/commit/1183ae9c39362299c59b0de12ba729e7bbc00191))

## [4.5.1](https://github.com/Pocket/terraform-modules/compare/v4.5.0...v4.5.1) (2023-01-04)


### Bug Fixes

* have empty commit with `fix` to force version update ([#1020](https://github.com/Pocket/terraform-modules/issues/1020)) ([21bdcdd](https://github.com/Pocket/terraform-modules/commit/21bdcdd896ddff7c87aa01d2625b2b291b89309d))

## [4.5.0](https://github.com/Pocket/terraform-modules/compare/v4.4.0...v4.5.0) (2023-01-04)


### Features

* **efs:** Adding persistent storage option for ApplicationECSService ([#1017](https://github.com/Pocket/terraform-modules/issues/1017)) ([fdc7966](https://github.com/Pocket/terraform-modules/commit/fdc7966e3301cb2bb5468d60fb122db055da4c7b))

## [4.4.0](https://github.com/Pocket/terraform-modules/compare/v4.3.0...v4.4.0) (2022-10-12)


### Features

* **dynamodb streams:** expose enum of stream types & add error checking ([#1009](https://github.com/Pocket/terraform-modules/issues/1009)) ([8f8d244](https://github.com/Pocket/terraform-modules/commit/8f8d244e97371ce9fb58533cc278270172e70fea))

## [4.3.0](https://github.com/Pocket/terraform-modules/compare/v4.2.6...v4.3.0) (2022-09-24)


### Features

*  DLQ as an optional parameter to ApplicationSqsSnsTopicSubscriptionProps ([#1005](https://github.com/Pocket/terraform-modules/issues/1005)) ([e291811](https://github.com/Pocket/terraform-modules/commit/e291811467ec286ee0b50edd9698b55e90a3aade))

## [4.2.6](https://github.com/Pocket/terraform-modules/compare/v4.2.5...v4.2.6) (2022-09-08)


### Bug Fixes

* **deps:** update cdktf ([#1003](https://github.com/Pocket/terraform-modules/issues/1003)) ([c1d4197](https://github.com/Pocket/terraform-modules/commit/c1d41977705141660373545db0d818e1cd096781))

## [4.2.5](https://github.com/Pocket/terraform-modules/compare/v4.2.4...v4.2.5) (2022-08-30)


### Bug Fixes

* **deps:** update cdktf ([#1001](https://github.com/Pocket/terraform-modules/issues/1001)) ([847627c](https://github.com/Pocket/terraform-modules/commit/847627ce605155ff0c475995893dcc60ac966c78))

## [4.2.4](https://github.com/Pocket/terraform-modules/compare/v4.2.3...v4.2.4) (2022-08-26)


### Bug Fixes

* **deps:** update cdktf ([#995](https://github.com/Pocket/terraform-modules/issues/995)) ([373ee5c](https://github.com/Pocket/terraform-modules/commit/373ee5cc19aa72da06b82565dd5be3d1c346bf7a))

## [4.2.3](https://github.com/Pocket/terraform-modules/compare/v4.2.2...v4.2.3) (2022-08-12)


### Bug Fixes

* **deps:** update cdktf ([#993](https://github.com/Pocket/terraform-modules/issues/993)) ([d77fa80](https://github.com/Pocket/terraform-modules/commit/d77fa800b9f631e59cc89ed6a8e90298c042b9b1))

## [4.2.2](https://github.com/Pocket/terraform-modules/compare/v4.2.1...v4.2.2) (2022-08-09)


### Bug Fixes

* **deps:** update cdktf ([#982](https://github.com/Pocket/terraform-modules/issues/982)) ([63f8a48](https://github.com/Pocket/terraform-modules/commit/63f8a483a08d59ab116ba35e21cef95525b3cf91))

## [4.2.1](https://github.com/Pocket/terraform-modules/compare/v4.2.0...v4.2.1) (2022-08-02)


### Bug Fixes

* **eventBridgeRule:** expose scheduleExpression through Pocket- constructs ([#991](https://github.com/Pocket/terraform-modules/issues/991)) ([06c044f](https://github.com/Pocket/terraform-modules/commit/06c044f45fe10c4b3d7a8860aa865f1a9e8149e2))

## [4.2.0](https://github.com/Pocket/terraform-modules/compare/v4.1.4...v4.2.0) (2022-08-01)


### Features

* **ApplicationEventBridgeRule:** expose scheduleExpression ([#989](https://github.com/Pocket/terraform-modules/issues/989)) ([92b6c21](https://github.com/Pocket/terraform-modules/commit/92b6c2179baecd928b554101954a58187807e8ab))

## [4.1.4](https://github.com/Pocket/terraform-modules/compare/v4.1.3...v4.1.4) (2022-08-01)


### Bug Fixes

* **deps:** update cdktf ([#987](https://github.com/Pocket/terraform-modules/issues/987)) ([92e78cf](https://github.com/Pocket/terraform-modules/commit/92e78cf0b0b83e8853d906395ecdbf6421a40d9e))

## [4.1.3](https://github.com/Pocket/terraform-modules/compare/v4.1.2...v4.1.3) (2022-07-28)


### Bug Fixes

* **deps:** update cdktf (major) ([#985](https://github.com/Pocket/terraform-modules/issues/985)) ([cd2efea](https://github.com/Pocket/terraform-modules/commit/cd2efea4e6b8db2ad59a0474d774425513695af1))

## [4.1.2](https://github.com/Pocket/terraform-modules/compare/v4.1.1...v4.1.2) (2022-07-22)


### Bug Fixes

* **deps:** update cdktf ([#971](https://github.com/Pocket/terraform-modules/issues/971)) ([a80e3ea](https://github.com/Pocket/terraform-modules/commit/a80e3ea1bc7d23a321343de11d3ff945ec986ca6))

## [4.1.1](https://github.com/Pocket/terraform-modules/compare/v4.1.0...v4.1.1) (2022-07-21)


### Bug Fixes

* export ApplicationLambdaSnsTopicSubscription ([#981](https://github.com/Pocket/terraform-modules/issues/981)) ([936df5a](https://github.com/Pocket/terraform-modules/commit/936df5a88c188eb8ddae7f9b4fcdf00123d991e7))

## [4.1.0](https://github.com/Pocket/terraform-modules/compare/v4.0.5...v4.1.0) (2022-07-21)


### Features

* Lambda subscription on SNS topic ([#974](https://github.com/Pocket/terraform-modules/issues/974)) ([5abb010](https://github.com/Pocket/terraform-modules/commit/5abb0104fb77005d7b7e5b231003df305ac7761d))

## [4.0.5](https://github.com/Pocket/terraform-modules/compare/v4.0.4...v4.0.5) (2022-07-14)


### Bug Fixes

* remove validation as its done during terraform apply  ([#977](https://github.com/Pocket/terraform-modules/issues/977)) ([56e74e6](https://github.com/Pocket/terraform-modules/commit/56e74e646bebb8ad2defd09f39e17e89ff0347c2))

## [4.0.4](https://github.com/Pocket/terraform-modules/compare/v4.0.3...v4.0.4) (2022-07-14)


### Bug Fixes

* **EventBridgeRule:** make terraform resource optional ([#972](https://github.com/Pocket/terraform-modules/issues/972)) ([3458b6a](https://github.com/Pocket/terraform-modules/commit/3458b6a29c203aa90357fc70f10096739ec3e0b3))

## [4.0.3](https://github.com/Pocket/terraform-modules/compare/v4.0.2...v4.0.3) (2022-07-08)


### Bug Fixes

* **deps:** update cdktf ([#967](https://github.com/Pocket/terraform-modules/issues/967)) ([8c58a84](https://github.com/Pocket/terraform-modules/commit/8c58a84684b312959d8c421246e0f43e727c04ab))

## [4.0.2](https://github.com/Pocket/terraform-modules/compare/v4.0.1...v4.0.2) (2022-07-08)


### Bug Fixes

* **newrelic:** Update sum to slideBy ([#968](https://github.com/Pocket/terraform-modules/issues/968)) ([31bd9cf](https://github.com/Pocket/terraform-modules/commit/31bd9cf836dc5fcfd88c414697e5cecff60a0dd9))

## [4.0.1](https://github.com/Pocket/terraform-modules/compare/v4.0.0...v4.0.1) (2022-07-06)


### Bug Fixes

* **deps:** update cdktf ([#957](https://github.com/Pocket/terraform-modules/issues/957)) ([66681ff](https://github.com/Pocket/terraform-modules/commit/66681ff22af426b918eddf3d0d554fad7ae65916))

## [4.0.0](https://github.com/Pocket/terraform-modules/compare/v3.13.10...v4.0.0) (2022-06-17)


### ⚠ BREAKING CHANGES

* **peer:** we are moving to direct dependencies instead of relying on peer dependencies

### Bug Fixes

* **peer:** removing peer depedencies in favor of direct usage ([#958](https://github.com/Pocket/terraform-modules/issues/958)) ([96b7fe0](https://github.com/Pocket/terraform-modules/commit/96b7fe04f41611fad40508609752b78ac557ae12))

## [3.13.10](https://github.com/Pocket/terraform-modules/compare/v3.13.9...v3.13.10) (2022-06-17)


### Bug Fixes

* **deps:** update cdktf ([#947](https://github.com/Pocket/terraform-modules/issues/947)) ([43667bd](https://github.com/Pocket/terraform-modules/commit/43667bd5b74fbc7712fd7a2940958ed336e5aaa8))

## [3.13.9](https://github.com/Pocket/terraform-modules/compare/v3.13.8...v3.13.9) (2022-06-02)


### Bug Fixes

* **deps:** update cdktf ([#938](https://github.com/Pocket/terraform-modules/issues/938)) ([85b7d77](https://github.com/Pocket/terraform-modules/commit/85b7d770f699e136b4f7b4a60b7cd5d64e0d08cd))

### [3.13.8](https://github.com/Pocket/terraform-modules/compare/v3.13.7...v3.13.8) (2022-05-26)


### Bug Fixes

* **ECS IAM:** Expose ECS IAM role from the ApplicationECSService construct ([#940](https://github.com/Pocket/terraform-modules/issues/940)) ([ae5912f](https://github.com/Pocket/terraform-modules/commit/ae5912f1e764afa2d5a6621ed3c180d24983d75e))

### [3.13.7](https://github.com/Pocket/terraform-modules/compare/v3.13.6...v3.13.7) (2022-05-26)


### Bug Fixes

* **ECS Application:** Add a basic ECS application construct ([#939](https://github.com/Pocket/terraform-modules/issues/939)) ([ec44aad](https://github.com/Pocket/terraform-modules/commit/ec44aad75206c15e5dde1ce6689de314f8259240))

### [3.13.6](https://github.com/Pocket/terraform-modules/compare/v3.13.5...v3.13.6) (2022-05-25)


### Bug Fixes

* **deps:** update dependency @cdktf/provider-aws to v8.0.1 ([#937](https://github.com/Pocket/terraform-modules/issues/937)) ([e88ffde](https://github.com/Pocket/terraform-modules/commit/e88ffde31bb7494c93584e946e1dee7daa618a5e))

### [3.13.5](https://github.com/Pocket/terraform-modules/compare/v3.13.4...v3.13.5) (2022-05-25)


### Bug Fixes

* **deps:** update cdktf ([#930](https://github.com/Pocket/terraform-modules/issues/930)) ([bbcc3f3](https://github.com/Pocket/terraform-modules/commit/bbcc3f3849e5dd89ff764c2bdcabc3674de03d6b))

### [3.13.4](https://github.com/Pocket/terraform-modules/compare/v3.13.3...v3.13.4) (2022-05-19)


### Bug Fixes

* **standards:** updating to latest pocket standards ([#929](https://github.com/Pocket/terraform-modules/issues/929)) ([5ecc36c](https://github.com/Pocket/terraform-modules/commit/5ecc36c60a4919b011bb35d489e34095ccb31b52))

### [3.13.3](https://github.com/Pocket/terraform-modules/compare/v3.13.2...v3.13.3) (2022-05-19)


### Bug Fixes

* **deps:** update cdktf ([#921](https://github.com/Pocket/terraform-modules/issues/921)) ([40b70b1](https://github.com/Pocket/terraform-modules/commit/40b70b18c96943afdc24602f22177542b7c1f235))

### [3.13.2](https://github.com/Pocket/terraform-modules/compare/v3.13.1...v3.13.2) (2022-05-16)


### Bug Fixes

* **lambda:** add NodeJS 16 support ([#926](https://github.com/Pocket/terraform-modules/issues/926)) ([afd4f44](https://github.com/Pocket/terraform-modules/commit/afd4f44200f845a6e63857acafce75fb41d5f1d3))

### [3.13.1](https://github.com/Pocket/terraform-modules/compare/v3.13.0...v3.13.1) (2022-05-13)


### Bug Fixes

* **sns:** create SNS to SQS subscription construct ([#925](https://github.com/Pocket/terraform-modules/issues/925)) ([778e309](https://github.com/Pocket/terraform-modules/commit/778e3090f3258fdf641eb21c5ab01283abee0095))

## [3.13.0](https://github.com/Pocket/terraform-modules/compare/v3.12.1...v3.13.0) (2022-05-05)


### Features

* **PocketECSCodePipeline:** add parameter for custom artifact bucket name [FFRECSV2-218] ([#923](https://github.com/Pocket/terraform-modules/issues/923)) ([363e3eb](https://github.com/Pocket/terraform-modules/commit/363e3eb9fabdd25416beda1d863cc7f969c1b43b))

### [3.12.1](https://github.com/Pocket/terraform-modules/compare/v3.12.0...v3.12.1) (2022-05-04)


### Bug Fixes

* **deps:** update cdktf ([#919](https://github.com/Pocket/terraform-modules/issues/919)) ([9c7e38c](https://github.com/Pocket/terraform-modules/commit/9c7e38c4d522dfbc2a5facfc6888184398492083))

## [3.12.0](https://github.com/Pocket/terraform-modules/compare/v3.11.2...v3.12.0) (2022-05-03)


### Features

* **lambda:** expose reservedConcurrencyLimit and memorySize (in MB) to lambda props ([#920](https://github.com/Pocket/terraform-modules/issues/920)) ([9f72e3d](https://github.com/Pocket/terraform-modules/commit/9f72e3da1a776942a2a646d1d4cc794a1215f99b))

### [3.11.2](https://github.com/Pocket/terraform-modules/compare/v3.11.1...v3.11.2) (2022-05-02)


### Bug Fixes

* **deps:** update cdktf ([#907](https://github.com/Pocket/terraform-modules/issues/907)) ([c8ba70d](https://github.com/Pocket/terraform-modules/commit/c8ba70d21b0f6e4838e7717d4c10624102217f2e))

### [3.11.1](https://github.com/Pocket/terraform-modules/compare/v3.11.0...v3.11.1) (2022-04-29)


### Bug Fixes

* **application ecs service:** expose ECR repos and task definition ([#918](https://github.com/Pocket/terraform-modules/issues/918)) ([e69a4fe](https://github.com/Pocket/terraform-modules/commit/e69a4fe4d9a9c66315fa38118d16adf00edf2374))

## [3.11.0](https://github.com/Pocket/terraform-modules/compare/v3.10.0...v3.11.0) (2022-04-21)


### Features

* **event-bus:** add event bus application construct ([#899](https://github.com/Pocket/terraform-modules/issues/899)) ([1dae564](https://github.com/Pocket/terraform-modules/commit/1dae564b55d7b763ee2eb232dbd22f64562bdb34))

## [3.10.0](https://github.com/Pocket/terraform-modules/compare/v3.9.1...v3.10.0) (2022-04-12)


### Features

* **notifications:** [INFRA-419] make code deploy notifications configurable ([#911](https://github.com/Pocket/terraform-modules/issues/911)) ([3716e4f](https://github.com/Pocket/terraform-modules/commit/3716e4f85493d3fad18fa7c0c6f985279b120b90))

### [3.9.1](https://github.com/Pocket/terraform-modules/compare/v3.9.0...v3.9.1) (2022-04-07)


### Bug Fixes

* **application sqs queue:** expose dead letter queue ([#910](https://github.com/Pocket/terraform-modules/issues/910)) ([ff53596](https://github.com/Pocket/terraform-modules/commit/ff53596d25afdeb01537c3f4ea5d5f814f4d2387))

## [3.9.0](https://github.com/Pocket/terraform-modules/compare/v3.8.0...v3.9.0) (2022-04-04)


### Features

* expose sqsQueueResource on PocketSQSWithLambdaTarget ([#909](https://github.com/Pocket/terraform-modules/issues/909)) ([b414f0c](https://github.com/Pocket/terraform-modules/commit/b414f0c9259753f9fb7cf3eda458c926bbecaa28))

## [3.8.0](https://github.com/Pocket/terraform-modules/compare/v3.7.1...v3.8.0) (2022-03-24)


### Features

* **aws/backups:** aws backup integration ([05d1a94](https://github.com/Pocket/terraform-modules/commit/05d1a9414632e93ec8c213cb1f9b0ef6b013e2ac))

### [3.7.1](https://github.com/Pocket/terraform-modules/compare/v3.7.0...v3.7.1) (2022-03-22)


### Bug Fixes

* **event bridge with multiple targets:** export PocketEventBridgeWithLambdaTarget construct ([#900](https://github.com/Pocket/terraform-modules/issues/900)) ([dd7460e](https://github.com/Pocket/terraform-modules/commit/dd7460e86b2e59f2f2328921f447780fda2201a2))

## [3.7.0](https://github.com/Pocket/terraform-modules/compare/v3.6.1...v3.7.0) (2022-03-21)


### Features

* **event-bridge:** add multiple lambda target to same eventBridgeRule ([#888](https://github.com/Pocket/terraform-modules/issues/888)) ([02c1233](https://github.com/Pocket/terraform-modules/commit/02c1233942f57a860961e260f6b58b21e14da1e5))

### [3.6.1](https://github.com/Pocket/terraform-modules/compare/v3.6.0...v3.6.1) (2022-03-16)


### Bug Fixes

* **deps:** update cdktf ([#895](https://github.com/Pocket/terraform-modules/issues/895)) ([713d68a](https://github.com/Pocket/terraform-modules/commit/713d68a9f96e1b7abc7bd370d1ebd5992c532e91))

## [3.6.0](https://github.com/Pocket/terraform-modules/compare/v3.5.2...v3.6.0) (2022-03-14)


### Features

* **sqsLambda:** make functionResponseTypes configurable ([#896](https://github.com/Pocket/terraform-modules/issues/896)) ([ae844a4](https://github.com/Pocket/terraform-modules/commit/ae844a4e669d2e3e43a85aafbb15be317cb8adc3))

### [3.5.2](https://github.com/Pocket/terraform-modules/compare/v3.5.1...v3.5.2) (2022-02-25)


### Bug Fixes

* **deps:** update cdktf ([#892](https://github.com/Pocket/terraform-modules/issues/892)) ([4c6587d](https://github.com/Pocket/terraform-modules/commit/4c6587d2fe6d21243b51b196b0541636626738d5))

### [3.5.1](https://github.com/Pocket/terraform-modules/compare/v3.5.0...v3.5.1) (2022-02-17)


### Bug Fixes

* **deps:** update cdktf ([#886](https://github.com/Pocket/terraform-modules/issues/886)) ([beedee1](https://github.com/Pocket/terraform-modules/commit/beedee1b5936263d8a449eee18d1f91534447d9c))

## [3.5.0](https://github.com/Pocket/terraform-modules/compare/v3.4.32...v3.5.0) (2022-02-11)


### Features

* **cdktf:** update cdktf 0.9 ([#880](https://github.com/Pocket/terraform-modules/issues/880)) ([f83453e](https://github.com/Pocket/terraform-modules/commit/f83453ec65f2d75c625b80e32d5a8d14d3ccd258))

### [3.4.32](https://github.com/Pocket/terraform-modules/compare/v3.4.31...v3.4.32) (2022-02-08)


### Bug Fixes

* **deps:** bump constructs from 10.0.54 to 10.0.55 ([#867](https://github.com/Pocket/terraform-modules/issues/867)) ([45e2118](https://github.com/Pocket/terraform-modules/commit/45e2118f5ec4d686fca35c8d09f9a35cf44d2b0e))

### [3.4.31](https://github.com/Pocket/terraform-modules/compare/v3.4.30...v3.4.31) (2022-02-07)


### Bug Fixes

* **deps:** bump constructs from 10.0.52 to 10.0.54 ([#864](https://github.com/Pocket/terraform-modules/issues/864)) ([21886cd](https://github.com/Pocket/terraform-modules/commit/21886cd6a3ee82caf89dd3e8db95002ea73500e0))

### [3.4.30](https://github.com/Pocket/terraform-modules/compare/v3.4.29...v3.4.30) (2022-02-02)


### Bug Fixes

* **deps:** bump constructs from 10.0.51 to 10.0.52 ([#861](https://github.com/Pocket/terraform-modules/issues/861)) ([554e7a2](https://github.com/Pocket/terraform-modules/commit/554e7a27a155e9867f76e9a691c3d63c82c6d957))

### [3.4.29](https://github.com/Pocket/terraform-modules/compare/v3.4.28...v3.4.29) (2022-02-01)


### Bug Fixes

* **deps:** bump constructs from 10.0.50 to 10.0.51 ([#858](https://github.com/Pocket/terraform-modules/issues/858)) ([23afac5](https://github.com/Pocket/terraform-modules/commit/23afac5568218f7d56f8fcc6c0135768f0cec093))

### [3.4.28](https://github.com/Pocket/terraform-modules/compare/v3.4.27...v3.4.28) (2022-01-31)


### Bug Fixes

* **deps:** bump constructs from 10.0.47 to 10.0.50 ([#855](https://github.com/Pocket/terraform-modules/issues/855)) ([e6cc01d](https://github.com/Pocket/terraform-modules/commit/e6cc01d7461640fc6dd402c7acf7488a540ea937))

### [3.4.27](https://github.com/Pocket/terraform-modules/compare/v3.4.26...v3.4.27) (2022-01-28)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.217 to 0.2.219 ([#851](https://github.com/Pocket/terraform-modules/issues/851)) ([7a749cd](https://github.com/Pocket/terraform-modules/commit/7a749cdd6eba4c7dff955b77dea4c192963b9af9))

### [3.4.26](https://github.com/Pocket/terraform-modules/compare/v3.4.25...v3.4.26) (2022-01-28)


### Bug Fixes

* **deps:** bump constructs from 10.0.45 to 10.0.47 ([#853](https://github.com/Pocket/terraform-modules/issues/853)) ([cbd85c1](https://github.com/Pocket/terraform-modules/commit/cbd85c105426001c52a926f495760be0c1bc9513))

### [3.4.25](https://github.com/Pocket/terraform-modules/compare/v3.4.24...v3.4.25) (2022-01-26)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.159 to 0.4.160 ([#848](https://github.com/Pocket/terraform-modules/issues/848)) ([254dac8](https://github.com/Pocket/terraform-modules/commit/254dac8889a61a7554cb1dd6608b5b4ae0f9caca))

### [3.4.24](https://github.com/Pocket/terraform-modules/compare/v3.4.23...v3.4.24) (2022-01-26)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.163 to 0.2.164 ([#844](https://github.com/Pocket/terraform-modules/issues/844)) ([f8e0b8f](https://github.com/Pocket/terraform-modules/commit/f8e0b8f70a8c8281ca9fda8921a1bbe4c580dbe0))

### [3.4.23](https://github.com/Pocket/terraform-modules/compare/v3.4.22...v3.4.23) (2022-01-26)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.161 to 0.2.162 ([#846](https://github.com/Pocket/terraform-modules/issues/846)) ([5c53c0c](https://github.com/Pocket/terraform-modules/commit/5c53c0ce734232a89edd7430a176416a41fca194))

### [3.4.22](https://github.com/Pocket/terraform-modules/compare/v3.4.21...v3.4.22) (2022-01-26)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.150 to 0.2.151 ([#843](https://github.com/Pocket/terraform-modules/issues/843)) ([d5abfff](https://github.com/Pocket/terraform-modules/commit/d5abfff0429944a55995a831fae5b0056baa14a6))

### [3.4.21](https://github.com/Pocket/terraform-modules/compare/v3.4.20...v3.4.21) (2022-01-26)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.211 to 0.2.217 ([#845](https://github.com/Pocket/terraform-modules/issues/845)) ([cec1668](https://github.com/Pocket/terraform-modules/commit/cec16689618f2404f976674cbe0878fb3daff2e2))

### [3.4.20](https://github.com/Pocket/terraform-modules/compare/v3.4.19...v3.4.20) (2022-01-26)


### Bug Fixes

* **deps:** bump constructs from 10.0.44 to 10.0.45 ([#842](https://github.com/Pocket/terraform-modules/issues/842)) ([6614ee6](https://github.com/Pocket/terraform-modules/commit/6614ee6cacab1fc4ca04e7d7e1332f3a85d964b4))

### [3.4.19](https://github.com/Pocket/terraform-modules/compare/v3.4.18...v3.4.19) (2022-01-26)


### Bug Fixes

* **deps:** bump @cdktf/provider-aws from 4.0.17 to 4.0.18 ([#841](https://github.com/Pocket/terraform-modules/issues/841)) ([2f2a368](https://github.com/Pocket/terraform-modules/commit/2f2a368c8e3c066a6aeaa0e57c398aa5e0f1803a))

### [3.4.18](https://github.com/Pocket/terraform-modules/compare/v3.4.17...v3.4.18) (2022-01-25)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.159 to 0.2.163 ([#839](https://github.com/Pocket/terraform-modules/issues/839)) ([cc4afee](https://github.com/Pocket/terraform-modules/commit/cc4afee0201fac8339eea469b28ca2c26b3c921b))

### [3.4.17](https://github.com/Pocket/terraform-modules/compare/v3.4.16...v3.4.17) (2022-01-25)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.160 to 0.2.161 ([#838](https://github.com/Pocket/terraform-modules/issues/838)) ([271ef99](https://github.com/Pocket/terraform-modules/commit/271ef99c5a212c0a824faac3282450274022eb32))

### [3.4.16](https://github.com/Pocket/terraform-modules/compare/v3.4.15...v3.4.16) (2022-01-25)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.149 to 0.2.150 ([#835](https://github.com/Pocket/terraform-modules/issues/835)) ([c99597a](https://github.com/Pocket/terraform-modules/commit/c99597ae6f9fb5ee939fcfb23ade5ef52d9f9fdb))

### [3.4.15](https://github.com/Pocket/terraform-modules/compare/v3.4.14...v3.4.15) (2022-01-25)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.204 to 0.2.211 ([#837](https://github.com/Pocket/terraform-modules/issues/837)) ([cf0c882](https://github.com/Pocket/terraform-modules/commit/cf0c882193192098387a8df013678e13db5a5fcf))

### [3.4.14](https://github.com/Pocket/terraform-modules/compare/v3.4.13...v3.4.14) (2022-01-25)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.155 to 0.4.159 ([#836](https://github.com/Pocket/terraform-modules/issues/836)) ([d78b643](https://github.com/Pocket/terraform-modules/commit/d78b64383e4e19b9b884212b2204c2d70f3c5408))

### [3.4.13](https://github.com/Pocket/terraform-modules/compare/v3.4.12...v3.4.13) (2022-01-25)


### Bug Fixes

* **deps:** bump constructs from 10.0.40 to 10.0.44 ([#831](https://github.com/Pocket/terraform-modules/issues/831)) ([751f986](https://github.com/Pocket/terraform-modules/commit/751f9865518f7600819206845941e8e17a51c57c))

### [3.4.12](https://github.com/Pocket/terraform-modules/compare/v3.4.11...v3.4.12) (2022-01-25)


### Bug Fixes

* **deps:** bump @cdktf/provider-aws from 4.0.16 to 4.0.17 ([#834](https://github.com/Pocket/terraform-modules/issues/834)) ([e4f52be](https://github.com/Pocket/terraform-modules/commit/e4f52be9690c4ecc148f80852a2af268c0a37fbd))

### [3.4.11](https://github.com/Pocket/terraform-modules/compare/v3.4.10...v3.4.11) (2022-01-24)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.146 to 0.2.149 ([#827](https://github.com/Pocket/terraform-modules/issues/827)) ([a27bd74](https://github.com/Pocket/terraform-modules/commit/a27bd747275268bea9892e424f05febb49a04d62))

### [3.4.10](https://github.com/Pocket/terraform-modules/compare/v3.4.9...v3.4.10) (2022-01-24)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.157 to 0.2.160 ([#829](https://github.com/Pocket/terraform-modules/issues/829)) ([629549d](https://github.com/Pocket/terraform-modules/commit/629549d0eee609febefe8149f777dc734ea291f7))

### [3.4.9](https://github.com/Pocket/terraform-modules/compare/v3.4.8...v3.4.9) (2022-01-24)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.188 to 0.2.204 ([#828](https://github.com/Pocket/terraform-modules/issues/828)) ([637cdfb](https://github.com/Pocket/terraform-modules/commit/637cdfba0db79f416e8e702ce0d1da0ae56f75b1))

### [3.4.8](https://github.com/Pocket/terraform-modules/compare/v3.4.7...v3.4.8) (2022-01-24)


### Bug Fixes

* **deps:** bump @cdktf/provider-aws from 4.0.14 to 4.0.16 ([#826](https://github.com/Pocket/terraform-modules/issues/826)) ([f6ed8a4](https://github.com/Pocket/terraform-modules/commit/f6ed8a4585022b8a7e5296907e03cc3623ef8b08))

### [3.4.7](https://github.com/Pocket/terraform-modules/compare/v3.4.6...v3.4.7) (2022-01-21)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.156 to 0.2.157 ([#824](https://github.com/Pocket/terraform-modules/issues/824)) ([1c14af4](https://github.com/Pocket/terraform-modules/commit/1c14af448fcc4ea5170c22464920b6f364bfc88e))

### [3.4.6](https://github.com/Pocket/terraform-modules/compare/v3.4.5...v3.4.6) (2022-01-21)


### Bug Fixes

* **deps:** bump constructs from 10.0.39 to 10.0.40 ([#819](https://github.com/Pocket/terraform-modules/issues/819)) ([c472898](https://github.com/Pocket/terraform-modules/commit/c4728981617457e6c6d54b2ebc499f0ea25f7d86))

### [3.4.5](https://github.com/Pocket/terraform-modules/compare/v3.4.4...v3.4.5) (2022-01-21)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.145 to 0.2.146 ([#823](https://github.com/Pocket/terraform-modules/issues/823)) ([1e0f2bf](https://github.com/Pocket/terraform-modules/commit/1e0f2bff24aa0a2730dee0e84cddbf6f245a941f))

### [3.4.4](https://github.com/Pocket/terraform-modules/compare/v3.4.3...v3.4.4) (2022-01-21)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.154 to 0.4.155 ([#818](https://github.com/Pocket/terraform-modules/issues/818)) ([52b259f](https://github.com/Pocket/terraform-modules/commit/52b259f14ea8ccdaee1491858c12f49287db5a82))

### [3.4.3](https://github.com/Pocket/terraform-modules/compare/v3.4.2...v3.4.3) (2022-01-21)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.182 to 0.2.188 ([#822](https://github.com/Pocket/terraform-modules/issues/822)) ([7ad3e19](https://github.com/Pocket/terraform-modules/commit/7ad3e19bb247e73cb524d2ee7a43f80c1894e304))

### [3.4.2](https://github.com/Pocket/terraform-modules/compare/v3.4.1...v3.4.2) (2022-01-21)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.158 to 0.2.159 ([#820](https://github.com/Pocket/terraform-modules/issues/820)) ([1b8f229](https://github.com/Pocket/terraform-modules/commit/1b8f2292ad5a07a3fbfc7812054c6722bd228169))

### [3.4.1](https://github.com/Pocket/terraform-modules/compare/v3.4.0...v3.4.1) (2022-01-21)


### Bug Fixes

* **deps:** bump @cdktf/provider-aws from 4.0.13 to 4.0.14 ([#817](https://github.com/Pocket/terraform-modules/issues/817)) ([aab187c](https://github.com/Pocket/terraform-modules/commit/aab187c4add328ac3f396b6ad7250495a9d1f686))

## [3.4.0](https://github.com/Pocket/terraform-modules/compare/v3.3.14...v3.4.0) (2022-01-20)


### Features

* **PocketSynthetics:** Set fill value and fill option to close alerts in PagerDuty ([#816](https://github.com/Pocket/terraform-modules/issues/816)) ([cf471b6](https://github.com/Pocket/terraform-modules/commit/cf471b6c42b7d20ce543fd5b0d742f025b179bed))

### [3.3.14](https://github.com/Pocket/terraform-modules/compare/v3.3.13...v3.3.14) (2022-01-20)


### Bug Fixes

* **deps:** bump @cdktf/provider-aws from 4.0.12 to 4.0.13 ([#814](https://github.com/Pocket/terraform-modules/issues/814)) ([339c750](https://github.com/Pocket/terraform-modules/commit/339c750d6fc1b242b8580906004143000e8eff6c))

### [3.3.13](https://github.com/Pocket/terraform-modules/compare/v3.3.12...v3.3.13) (2022-01-20)


### Bug Fixes

* **deps:** bump constructs from 10.0.38 to 10.0.39 ([#812](https://github.com/Pocket/terraform-modules/issues/812)) ([2b660a0](https://github.com/Pocket/terraform-modules/commit/2b660a05d72a10234c4bb3135bfe02da312317ff))

### [3.3.12](https://github.com/Pocket/terraform-modules/compare/v3.3.11...v3.3.12) (2022-01-20)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.153 to 0.4.154 ([#811](https://github.com/Pocket/terraform-modules/issues/811)) ([7a46544](https://github.com/Pocket/terraform-modules/commit/7a46544612a5dc042976d8696149a84f6bb794a1))

### [3.3.11](https://github.com/Pocket/terraform-modules/compare/v3.3.10...v3.3.11) (2022-01-20)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.175 to 0.2.182 ([#813](https://github.com/Pocket/terraform-modules/issues/813)) ([fae74dd](https://github.com/Pocket/terraform-modules/commit/fae74dd8e7d3800fd0d278d930e6d0152f99b93a))

### [3.3.10](https://github.com/Pocket/terraform-modules/compare/v3.3.9...v3.3.10) (2022-01-20)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.144 to 0.2.145 ([#809](https://github.com/Pocket/terraform-modules/issues/809)) ([d281100](https://github.com/Pocket/terraform-modules/commit/d2811008fc33ad8276accfc6885d6557f6939f17))

### [3.3.9](https://github.com/Pocket/terraform-modules/compare/v3.3.8...v3.3.9) (2022-01-20)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.155 to 0.2.156 ([#810](https://github.com/Pocket/terraform-modules/issues/810)) ([56a20db](https://github.com/Pocket/terraform-modules/commit/56a20dbfbdb4fbb9c3edc30ebcb948b61c356706))

### [3.3.8](https://github.com/Pocket/terraform-modules/compare/v3.3.7...v3.3.8) (2022-01-20)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.157 to 0.2.158 ([#808](https://github.com/Pocket/terraform-modules/issues/808)) ([6cde74f](https://github.com/Pocket/terraform-modules/commit/6cde74fdc15fdff5256cca2288648f574b1a3768))

### [3.3.7](https://github.com/Pocket/terraform-modules/compare/v3.3.6...v3.3.7) (2022-01-19)


### Bug Fixes

* **deps:** bump constructs from 10.0.37 to 10.0.38 ([#797](https://github.com/Pocket/terraform-modules/issues/797)) ([7af5d34](https://github.com/Pocket/terraform-modules/commit/7af5d3481b8fd58b80083697473fbc01d6bd37a7))

### [3.3.6](https://github.com/Pocket/terraform-modules/compare/v3.3.5...v3.3.6) (2022-01-19)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.143 to 0.2.144 ([#806](https://github.com/Pocket/terraform-modules/issues/806)) ([042f348](https://github.com/Pocket/terraform-modules/commit/042f34891991071975f76ec430ab046c4e41c168))

### [3.3.5](https://github.com/Pocket/terraform-modules/compare/v3.3.4...v3.3.5) (2022-01-19)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.156 to 0.2.157 ([#805](https://github.com/Pocket/terraform-modules/issues/805)) ([2e889da](https://github.com/Pocket/terraform-modules/commit/2e889da808d0d77bfadda0c87884a1c1e6397cf8))

### [3.3.4](https://github.com/Pocket/terraform-modules/compare/v3.3.3...v3.3.4) (2022-01-19)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.152 to 0.4.153 ([#804](https://github.com/Pocket/terraform-modules/issues/804)) ([b74821a](https://github.com/Pocket/terraform-modules/commit/b74821a9d75911c3b06719575b31685f05028620))

### [3.3.3](https://github.com/Pocket/terraform-modules/compare/v3.3.2...v3.3.3) (2022-01-19)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.169 to 0.2.175 ([#803](https://github.com/Pocket/terraform-modules/issues/803)) ([c9b7f73](https://github.com/Pocket/terraform-modules/commit/c9b7f73c3f5cb9e64d7390302c59876f6e542c52))

### [3.3.2](https://github.com/Pocket/terraform-modules/compare/v3.3.1...v3.3.2) (2022-01-19)


### Bug Fixes

* **deps:** bump @cdktf/provider-aws from 4.0.11 to 4.0.12 ([#802](https://github.com/Pocket/terraform-modules/issues/802)) ([759a141](https://github.com/Pocket/terraform-modules/commit/759a141795b9cef8367c3ad3a40eaedda45d4b90))

### [3.3.1](https://github.com/Pocket/terraform-modules/compare/v3.3.0...v3.3.1) (2022-01-19)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.154 to 0.2.155 ([#798](https://github.com/Pocket/terraform-modules/issues/798)) ([7d2ab64](https://github.com/Pocket/terraform-modules/commit/7d2ab6437e36ba5a42746fa146944b0dac89d8dd))

## [3.3.0](https://github.com/Pocket/terraform-modules/compare/v3.2.12...v3.3.0) (2022-01-18)


### Features

* **region:** Pass region into aws command, default to us-east-1 ([#771](https://github.com/Pocket/terraform-modules/issues/771)) ([989e761](https://github.com/Pocket/terraform-modules/commit/989e7616dd5e4a824fdc3ade7770666e93030739))

### [3.2.12](https://github.com/Pocket/terraform-modules/compare/v3.2.11...v3.2.12) (2022-01-18)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.155 to 0.2.156 ([#795](https://github.com/Pocket/terraform-modules/issues/795)) ([c1922c9](https://github.com/Pocket/terraform-modules/commit/c1922c9b2f8d1bd59d58a7d1ecf6c13e72a3f1cc))

### [3.2.11](https://github.com/Pocket/terraform-modules/compare/v3.2.10...v3.2.11) (2022-01-18)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.145 to 0.2.169 ([#793](https://github.com/Pocket/terraform-modules/issues/793)) ([b60bb8e](https://github.com/Pocket/terraform-modules/commit/b60bb8ef5c8e51f273e9d50d4a3c5dcd33c925c9))

### [3.2.10](https://github.com/Pocket/terraform-modules/compare/v3.2.9...v3.2.10) (2022-01-18)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.153 to 0.2.154 ([#794](https://github.com/Pocket/terraform-modules/issues/794)) ([8e814d5](https://github.com/Pocket/terraform-modules/commit/8e814d559f3b1d52342db3e932386da81fa555dc))

### [3.2.9](https://github.com/Pocket/terraform-modules/compare/v3.2.8...v3.2.9) (2022-01-18)


### Bug Fixes

* **deps:** bump @cdktf/provider-aws from 4.0.4 to 4.0.11 ([#792](https://github.com/Pocket/terraform-modules/issues/792)) ([0260699](https://github.com/Pocket/terraform-modules/commit/026069998d516f2d5f07076b9d549ab62dc43917))

### [3.2.8](https://github.com/Pocket/terraform-modules/compare/v3.2.7...v3.2.8) (2022-01-18)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.151 to 0.4.152 ([#789](https://github.com/Pocket/terraform-modules/issues/789)) ([96f1043](https://github.com/Pocket/terraform-modules/commit/96f104379855ee2a09ae08d55868b6b3dbfc2957))

### [3.2.7](https://github.com/Pocket/terraform-modules/compare/v3.2.6...v3.2.7) (2022-01-18)


### Bug Fixes

* **deps:** bump constructs from 10.0.36 to 10.0.37 ([#787](https://github.com/Pocket/terraform-modules/issues/787)) ([a5b5617](https://github.com/Pocket/terraform-modules/commit/a5b56170afed7b2856829b148390dfc1d1f2ae64))

### [3.2.6](https://github.com/Pocket/terraform-modules/compare/v3.2.5...v3.2.6) (2022-01-18)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.142 to 0.2.143 ([#786](https://github.com/Pocket/terraform-modules/issues/786)) ([b60742e](https://github.com/Pocket/terraform-modules/commit/b60742ec504b3156c34b514fd258298788896e0d))

### [3.2.5](https://github.com/Pocket/terraform-modules/compare/v3.2.4...v3.2.5) (2022-01-17)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.147 to 0.2.153 ([#780](https://github.com/Pocket/terraform-modules/issues/780)) ([d56c7bc](https://github.com/Pocket/terraform-modules/commit/d56c7bcb9c65db953eabbf0580b942cf344b1de1))

### [3.2.4](https://github.com/Pocket/terraform-modules/compare/v3.2.3...v3.2.4) (2022-01-17)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.150 to 0.2.155 ([#784](https://github.com/Pocket/terraform-modules/issues/784)) ([e062009](https://github.com/Pocket/terraform-modules/commit/e0620097a29972779253e10dd823e7a4adb9f725))

### [3.2.3](https://github.com/Pocket/terraform-modules/compare/v3.2.2...v3.2.3) (2022-01-17)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.136 to 0.2.142 ([#785](https://github.com/Pocket/terraform-modules/issues/785)) ([e5a1598](https://github.com/Pocket/terraform-modules/commit/e5a1598179061f7007cc315cb6f0be92ee461130))

### [3.2.2](https://github.com/Pocket/terraform-modules/compare/v3.2.1...v3.2.2) (2022-01-17)


### Bug Fixes

* **deps:** bump constructs from 10.0.33 to 10.0.36 ([#781](https://github.com/Pocket/terraform-modules/issues/781)) ([ccc81ac](https://github.com/Pocket/terraform-modules/commit/ccc81acef05a75b556ea1c2fe7661b5fc7472467))

### [3.2.1](https://github.com/Pocket/terraform-modules/compare/v3.2.0...v3.2.1) (2022-01-17)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.145 to 0.4.151 ([#782](https://github.com/Pocket/terraform-modules/issues/782)) ([265fd1e](https://github.com/Pocket/terraform-modules/commit/265fd1e63582b19eb0bd46d4586ff67ec86ca6da))

## [3.2.0](https://github.com/Pocket/terraform-modules/compare/v3.1.16...v3.2.0) (2022-01-15)


### Features

* **pocket-ecs-codepipeline:** Make codepipeline steps extendable ([#748](https://github.com/Pocket/terraform-modules/issues/748)) ([b0779ba](https://github.com/Pocket/terraform-modules/commit/b0779bafb8c7303b422ae3ee29532886ede15aa2))

### [3.1.16](https://github.com/Pocket/terraform-modules/compare/v3.1.15...v3.1.16) (2022-01-14)


### Bug Fixes

* **deps:** bump constructs from 10.0.32 to 10.0.33 ([#779](https://github.com/Pocket/terraform-modules/issues/779)) ([eb23d97](https://github.com/Pocket/terraform-modules/commit/eb23d9742c41b9083057d7adad0f7c879bc34d15))

### [3.1.15](https://github.com/Pocket/terraform-modules/compare/v3.1.14...v3.1.15) (2022-01-13)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.135 to 0.2.136 ([#775](https://github.com/Pocket/terraform-modules/issues/775)) ([340e348](https://github.com/Pocket/terraform-modules/commit/340e348cbe0acb281c52a87534711ed27ead81b8))

### [3.1.14](https://github.com/Pocket/terraform-modules/compare/v3.1.13...v3.1.14) (2022-01-13)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.149 to 0.2.150 ([#774](https://github.com/Pocket/terraform-modules/issues/774)) ([e38aa6a](https://github.com/Pocket/terraform-modules/commit/e38aa6a74f50f7b3b8e8b825f720de6e6dfa4a0e))

### [3.1.13](https://github.com/Pocket/terraform-modules/compare/v3.1.12...v3.1.13) (2022-01-13)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.144 to 0.2.145 ([#777](https://github.com/Pocket/terraform-modules/issues/777)) ([4455c5c](https://github.com/Pocket/terraform-modules/commit/4455c5cf039e5d7166fd930eaeda56a6c112de14))

### [3.1.12](https://github.com/Pocket/terraform-modules/compare/v3.1.11...v3.1.12) (2022-01-13)


### Bug Fixes

* **deps:** bump constructs from 10.0.31 to 10.0.32 ([#778](https://github.com/Pocket/terraform-modules/issues/778)) ([60d72a1](https://github.com/Pocket/terraform-modules/commit/60d72a1b0c1d712132128ea224c6a166c5283206))

### [3.1.11](https://github.com/Pocket/terraform-modules/compare/v3.1.10...v3.1.11) (2022-01-13)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.144 to 0.4.145 ([#772](https://github.com/Pocket/terraform-modules/issues/772)) ([cd80aa1](https://github.com/Pocket/terraform-modules/commit/cd80aa12026bb9e319359e7123650d5bccb91882))

### [3.1.10](https://github.com/Pocket/terraform-modules/compare/v3.1.9...v3.1.10) (2022-01-13)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.146 to 0.2.147 ([#776](https://github.com/Pocket/terraform-modules/issues/776)) ([4a0ad41](https://github.com/Pocket/terraform-modules/commit/4a0ad411ba786c8a955fc1d5329bc9dfd573865d))

### [3.1.9](https://github.com/Pocket/terraform-modules/compare/v3.1.8...v3.1.9) (2022-01-13)


### Bug Fixes

* **deps:** bump @cdktf/provider-aws from 4.0.3 to 4.0.4 ([#773](https://github.com/Pocket/terraform-modules/issues/773)) ([03f8083](https://github.com/Pocket/terraform-modules/commit/03f8083231ee67240ba38ece52d11c4bff90fff6))

### [3.1.8](https://github.com/Pocket/terraform-modules/compare/v3.1.7...v3.1.8) (2022-01-12)


### Bug Fixes

* **deps:** bump constructs from 10.0.29 to 10.0.31 ([#770](https://github.com/Pocket/terraform-modules/issues/770)) ([9539c75](https://github.com/Pocket/terraform-modules/commit/9539c75ea070e7b97d3107c42f13d19e8ecc823c))

### [3.1.7](https://github.com/Pocket/terraform-modules/compare/v3.1.6...v3.1.7) (2022-01-11)


### Bug Fixes

* **deps:** bump @cdktf/provider-aws from 3.0.1 to 4.0.2 ([#763](https://github.com/Pocket/terraform-modules/issues/763)) ([74fa2dc](https://github.com/Pocket/terraform-modules/commit/74fa2dc772b415990c71b85989a82571e3851040))

### [3.1.6](https://github.com/Pocket/terraform-modules/compare/v3.1.5...v3.1.6) (2022-01-10)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.143 to 0.4.144 ([#767](https://github.com/Pocket/terraform-modules/issues/767)) ([65db55a](https://github.com/Pocket/terraform-modules/commit/65db55a8ad73fecd84ed2f7d69044a83566afe88))

### [3.1.5](https://github.com/Pocket/terraform-modules/compare/v3.1.4...v3.1.5) (2022-01-10)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.145 to 0.2.146 ([#762](https://github.com/Pocket/terraform-modules/issues/762)) ([dd50039](https://github.com/Pocket/terraform-modules/commit/dd500398b748d7aae759aefb800477355d3a9f28))

### [3.1.4](https://github.com/Pocket/terraform-modules/compare/v3.1.3...v3.1.4) (2022-01-10)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.148 to 0.2.149 ([#761](https://github.com/Pocket/terraform-modules/issues/761)) ([ec43c12](https://github.com/Pocket/terraform-modules/commit/ec43c120da5d007f60e2358303ba1beb72d0c91b))

### [3.1.3](https://github.com/Pocket/terraform-modules/compare/v3.1.2...v3.1.3) (2022-01-10)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.143 to 0.2.144 ([#766](https://github.com/Pocket/terraform-modules/issues/766)) ([8efe1b3](https://github.com/Pocket/terraform-modules/commit/8efe1b37ba22027b092c5eab034c3a5c3aa296b7))

### [3.1.2](https://github.com/Pocket/terraform-modules/compare/v3.1.1...v3.1.2) (2022-01-10)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.134 to 0.2.135 ([#764](https://github.com/Pocket/terraform-modules/issues/764)) ([09a6472](https://github.com/Pocket/terraform-modules/commit/09a6472b2fd291839aaf011869c777a45af5251d))

### [3.1.1](https://github.com/Pocket/terraform-modules/compare/v3.1.0...v3.1.1) (2022-01-10)


### Bug Fixes

* **deps:** bump constructs from 10.0.27 to 10.0.29 ([#765](https://github.com/Pocket/terraform-modules/issues/765)) ([7182a7f](https://github.com/Pocket/terraform-modules/commit/7182a7ff3e9416168807ee33c0e5ebafe9adf6e6))

## [3.1.0](https://github.com/Pocket/terraform-modules/compare/v3.0.92...v3.1.0) (2022-01-07)


### Features

* **ApplicationEcsContainerDefinition:** Add ability to pass boolean to essential ([#760](https://github.com/Pocket/terraform-modules/issues/760)) ([080d3d5](https://github.com/Pocket/terraform-modules/commit/080d3d526dda0877a310fe05ad54ef3096723b75))

### [3.0.92](https://github.com/Pocket/terraform-modules/compare/v3.0.91...v3.0.92) (2022-01-07)


### Bug Fixes

* **deps:** bump constructs from 10.0.26 to 10.0.27 ([#759](https://github.com/Pocket/terraform-modules/issues/759)) ([65fefa0](https://github.com/Pocket/terraform-modules/commit/65fefa0826333d06552791f4dd03f2f2672a70c5))

### [3.0.91](https://github.com/Pocket/terraform-modules/compare/v3.0.90...v3.0.91) (2022-01-06)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.144 to 0.2.145 ([#755](https://github.com/Pocket/terraform-modules/issues/755)) ([95b27c7](https://github.com/Pocket/terraform-modules/commit/95b27c776771edd949849dfaaadffc068d94ca28))

### [3.0.90](https://github.com/Pocket/terraform-modules/compare/v3.0.89...v3.0.90) (2022-01-06)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.142 to 0.2.143 ([#753](https://github.com/Pocket/terraform-modules/issues/753)) ([3669d63](https://github.com/Pocket/terraform-modules/commit/3669d63d670e5053e7beac99f150ef18fee1eb40))

### [3.0.89](https://github.com/Pocket/terraform-modules/compare/v3.0.88...v3.0.89) (2022-01-06)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.142 to 0.4.143 ([#756](https://github.com/Pocket/terraform-modules/issues/756)) ([f2188e6](https://github.com/Pocket/terraform-modules/commit/f2188e6dadb9695e7357a429d71ccb37655d40e7))

### [3.0.88](https://github.com/Pocket/terraform-modules/compare/v3.0.87...v3.0.88) (2022-01-06)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.147 to 0.2.148 ([#751](https://github.com/Pocket/terraform-modules/issues/751)) ([0ff597f](https://github.com/Pocket/terraform-modules/commit/0ff597ff37a702b94df56f96076779e812b86482))

### [3.0.87](https://github.com/Pocket/terraform-modules/compare/v3.0.86...v3.0.87) (2022-01-06)


### Bug Fixes

* **deps:** bump constructs from 10.0.25 to 10.0.26 ([#749](https://github.com/Pocket/terraform-modules/issues/749)) ([f2f42d4](https://github.com/Pocket/terraform-modules/commit/f2f42d48003fe69056e48a1240fd3d0e1c9a5245))

### [3.0.86](https://github.com/Pocket/terraform-modules/compare/v3.0.85...v3.0.86) (2022-01-06)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.133 to 0.2.134 ([#750](https://github.com/Pocket/terraform-modules/issues/750)) ([a9063f0](https://github.com/Pocket/terraform-modules/commit/a9063f06a1f17f007ba3bc4a31e6cd01c71c3a70))

### [3.0.85](https://github.com/Pocket/terraform-modules/compare/v3.0.84...v3.0.85) (2022-01-05)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.143 to 0.2.147 ([#745](https://github.com/Pocket/terraform-modules/issues/745)) ([72a4b13](https://github.com/Pocket/terraform-modules/commit/72a4b13da86914d9fc1a09f82522e8272536436b))

### [3.0.84](https://github.com/Pocket/terraform-modules/compare/v3.0.83...v3.0.84) (2022-01-05)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.140 to 0.2.144 ([#747](https://github.com/Pocket/terraform-modules/issues/747)) ([1d562eb](https://github.com/Pocket/terraform-modules/commit/1d562eb6bcccc718036be20a999afdea7d5a63b9))

### [3.0.83](https://github.com/Pocket/terraform-modules/compare/v3.0.82...v3.0.83) (2022-01-05)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.129 to 0.2.133 ([#742](https://github.com/Pocket/terraform-modules/issues/742)) ([c82ae19](https://github.com/Pocket/terraform-modules/commit/c82ae19f2af1e97c7dec6e66f5b38c27df822fee))

### [3.0.82](https://github.com/Pocket/terraform-modules/compare/v3.0.81...v3.0.82) (2022-01-05)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.138 to 0.4.142 ([#741](https://github.com/Pocket/terraform-modules/issues/741)) ([5a492f1](https://github.com/Pocket/terraform-modules/commit/5a492f1776a26fa6ab75907b6738dbc496de3c4c))

### [3.0.81](https://github.com/Pocket/terraform-modules/compare/v3.0.80...v3.0.81) (2022-01-05)


### Bug Fixes

* **deps:** bump constructs from 10.0.24 to 10.0.25 ([#740](https://github.com/Pocket/terraform-modules/issues/740)) ([ce31f6c](https://github.com/Pocket/terraform-modules/commit/ce31f6cc85ff21b59c0856fb089fc9e342f83a17))

### [3.0.80](https://github.com/Pocket/terraform-modules/compare/v3.0.79...v3.0.80) (2022-01-05)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.138 to 0.2.142 ([#739](https://github.com/Pocket/terraform-modules/issues/739)) ([dc8a7d9](https://github.com/Pocket/terraform-modules/commit/dc8a7d966b47344e0a8efa855d018c1ea2a29897))

### [3.0.79](https://github.com/Pocket/terraform-modules/compare/v3.0.78...v3.0.79) (2022-01-04)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.133 to 0.2.140 ([#735](https://github.com/Pocket/terraform-modules/issues/735)) ([5085cce](https://github.com/Pocket/terraform-modules/commit/5085cced1493b50eba02eacfd4371f7464a4ea5f))

### [3.0.78](https://github.com/Pocket/terraform-modules/compare/v3.0.77...v3.0.78) (2022-01-04)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.131 to 0.4.138 ([#736](https://github.com/Pocket/terraform-modules/issues/736)) ([ad032c9](https://github.com/Pocket/terraform-modules/commit/ad032c9925247e8d85f66199648e2f63c519ddcd))

### [3.0.77](https://github.com/Pocket/terraform-modules/compare/v3.0.76...v3.0.77) (2022-01-04)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.132 to 0.2.138 ([#737](https://github.com/Pocket/terraform-modules/issues/737)) ([84b6d6e](https://github.com/Pocket/terraform-modules/commit/84b6d6e1227f35601d524f60b3077a431acdacf6))

### [3.0.76](https://github.com/Pocket/terraform-modules/compare/v3.0.75...v3.0.76) (2022-01-04)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.128 to 0.2.129 ([#734](https://github.com/Pocket/terraform-modules/issues/734)) ([61d80f6](https://github.com/Pocket/terraform-modules/commit/61d80f626ab71507260360fffdcae6599f5ea1f1))

### [3.0.75](https://github.com/Pocket/terraform-modules/compare/v3.0.74...v3.0.75) (2022-01-04)


### Bug Fixes

* **deps:** bump constructs from 10.0.23 to 10.0.24 ([#732](https://github.com/Pocket/terraform-modules/issues/732)) ([307bf57](https://github.com/Pocket/terraform-modules/commit/307bf57779b4cd1c4e50ee2cf5d07c97f1330c2d))

### [3.0.74](https://github.com/Pocket/terraform-modules/compare/v3.0.73...v3.0.74) (2022-01-04)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.136 to 0.2.143 ([#733](https://github.com/Pocket/terraform-modules/issues/733)) ([471ec26](https://github.com/Pocket/terraform-modules/commit/471ec2673a82c000ae9493875dbed7c1e812f9ca))

### [3.0.73](https://github.com/Pocket/terraform-modules/compare/v3.0.72...v3.0.73) (2022-01-04)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.123 to 0.2.128 ([#729](https://github.com/Pocket/terraform-modules/issues/729)) ([cbd6d72](https://github.com/Pocket/terraform-modules/commit/cbd6d721e27430200bec76452abd9c7d77b13637))

### [3.0.72](https://github.com/Pocket/terraform-modules/compare/v3.0.71...v3.0.72) (2022-01-03)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.110 to 0.4.131 ([#723](https://github.com/Pocket/terraform-modules/issues/723)) ([0c68954](https://github.com/Pocket/terraform-modules/commit/0c68954d4fd0d68b2d6ef3c657371a098d2972a4))

### [3.0.71](https://github.com/Pocket/terraform-modules/compare/v3.0.70...v3.0.71) (2022-01-03)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.112 to 0.2.133 ([#722](https://github.com/Pocket/terraform-modules/issues/722)) ([da2fcba](https://github.com/Pocket/terraform-modules/commit/da2fcba750b2370bc66fd291455d351edfc2631c))

### [3.0.70](https://github.com/Pocket/terraform-modules/compare/v3.0.69...v3.0.70) (2022-01-03)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.131 to 0.2.132 ([#726](https://github.com/Pocket/terraform-modules/issues/726)) ([4b297f1](https://github.com/Pocket/terraform-modules/commit/4b297f1e5ad16062aa8f407455c68f169486b334))

### [3.0.69](https://github.com/Pocket/terraform-modules/compare/v3.0.68...v3.0.69) (2022-01-03)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.115 to 0.2.136 ([#724](https://github.com/Pocket/terraform-modules/issues/724)) ([e2efba1](https://github.com/Pocket/terraform-modules/commit/e2efba1da881044ed139b85232b0af93b55afed9))

### [3.0.68](https://github.com/Pocket/terraform-modules/compare/v3.0.67...v3.0.68) (2022-01-03)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.122 to 0.2.123 ([#725](https://github.com/Pocket/terraform-modules/issues/725)) ([ad09a3a](https://github.com/Pocket/terraform-modules/commit/ad09a3acc572566b0ed81660ca96cf81bdab6aa8))

### [3.0.67](https://github.com/Pocket/terraform-modules/compare/v3.0.66...v3.0.67) (2022-01-03)


### Bug Fixes

* **deps:** bump constructs from 10.0.20 to 10.0.23 ([#719](https://github.com/Pocket/terraform-modules/issues/719)) ([db1395a](https://github.com/Pocket/terraform-modules/commit/db1395a15f904320ee97510fb7ee94e09d480b08))

### [3.0.66](https://github.com/Pocket/terraform-modules/compare/v3.0.65...v3.0.66) (2022-01-03)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.112 to 0.2.131 ([#720](https://github.com/Pocket/terraform-modules/issues/720)) ([0a3d41f](https://github.com/Pocket/terraform-modules/commit/0a3d41f5e9792c2010247f3306ac87e2e80570bc))

### [3.0.65](https://github.com/Pocket/terraform-modules/compare/v3.0.64...v3.0.65) (2022-01-03)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.104 to 0.2.122 ([#717](https://github.com/Pocket/terraform-modules/issues/717)) ([6fa36e5](https://github.com/Pocket/terraform-modules/commit/6fa36e5487fef20848eeb20cf7ef7a9adaf3b5d6))

### [3.0.64](https://github.com/Pocket/terraform-modules/compare/v3.0.63...v3.0.64) (2021-12-31)


### Bug Fixes

* **deps:** bump constructs from 10.0.17 to 10.0.20 ([#715](https://github.com/Pocket/terraform-modules/issues/715)) ([1e6dd45](https://github.com/Pocket/terraform-modules/commit/1e6dd4558c2e9da8936c31e78111637027aa37f0))

### [3.0.63](https://github.com/Pocket/terraform-modules/compare/v3.0.62...v3.0.63) (2021-12-31)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.97 to 0.2.104 ([#712](https://github.com/Pocket/terraform-modules/issues/712)) ([d84757c](https://github.com/Pocket/terraform-modules/commit/d84757c69a55c8345b6303bac016f3f2829b4163))

### [3.0.62](https://github.com/Pocket/terraform-modules/compare/v3.0.61...v3.0.62) (2021-12-31)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.111 to 0.2.112 ([#714](https://github.com/Pocket/terraform-modules/issues/714)) ([f5b2b2d](https://github.com/Pocket/terraform-modules/commit/f5b2b2de73b7ff8eb62ab6d1b09ec08e3d6a21b5))

### [3.0.61](https://github.com/Pocket/terraform-modules/compare/v3.0.60...v3.0.61) (2021-12-31)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.103 to 0.4.110 ([#710](https://github.com/Pocket/terraform-modules/issues/710)) ([329efe4](https://github.com/Pocket/terraform-modules/commit/329efe4a4e6c9fca64fe93ef2e500b910a7e9cb7))

### [3.0.60](https://github.com/Pocket/terraform-modules/compare/v3.0.59...v3.0.60) (2021-12-31)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.106 to 0.2.112 ([#711](https://github.com/Pocket/terraform-modules/issues/711)) ([078bfca](https://github.com/Pocket/terraform-modules/commit/078bfcaa946775c86a6104364bbd14ac09058705))

### [3.0.59](https://github.com/Pocket/terraform-modules/compare/v3.0.58...v3.0.59) (2021-12-31)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.108 to 0.2.115 ([#713](https://github.com/Pocket/terraform-modules/issues/713)) ([e311478](https://github.com/Pocket/terraform-modules/commit/e311478ad64ccc1edc52fe180b64e263886a5e84))

### [3.0.58](https://github.com/Pocket/terraform-modules/compare/v3.0.57...v3.0.58) (2021-12-31)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.105 to 0.2.111 ([#706](https://github.com/Pocket/terraform-modules/issues/706)) ([45e41ae](https://github.com/Pocket/terraform-modules/commit/45e41ae0af09a4ac2d6fce6243f29ca392b9c699))

### [3.0.57](https://github.com/Pocket/terraform-modules/compare/v3.0.56...v3.0.57) (2021-12-30)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.105 to 0.2.106 ([#703](https://github.com/Pocket/terraform-modules/issues/703)) ([72c8e4c](https://github.com/Pocket/terraform-modules/commit/72c8e4c797baa173c1fcd1f4afa3d0e3d51323ad))

### [3.0.56](https://github.com/Pocket/terraform-modules/compare/v3.0.55...v3.0.56) (2021-12-30)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.101 to 0.2.108 ([#702](https://github.com/Pocket/terraform-modules/issues/702)) ([bd374a1](https://github.com/Pocket/terraform-modules/commit/bd374a11d4e3475049436dad0663b6fa6160f09e))

### [3.0.55](https://github.com/Pocket/terraform-modules/compare/v3.0.54...v3.0.55) (2021-12-30)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.98 to 0.2.105 ([#700](https://github.com/Pocket/terraform-modules/issues/700)) ([7682350](https://github.com/Pocket/terraform-modules/commit/768235086c88fc628eda1285a9937cab1d8c6adb))

### [3.0.54](https://github.com/Pocket/terraform-modules/compare/v3.0.53...v3.0.54) (2021-12-30)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.95 to 0.4.103 ([#704](https://github.com/Pocket/terraform-modules/issues/704)) ([3c1f820](https://github.com/Pocket/terraform-modules/commit/3c1f8208d704d0075740e642110eacfb96906e7b))

### [3.0.53](https://github.com/Pocket/terraform-modules/compare/v3.0.52...v3.0.53) (2021-12-30)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.90 to 0.2.97 ([#699](https://github.com/Pocket/terraform-modules/issues/699)) ([8bba9c0](https://github.com/Pocket/terraform-modules/commit/8bba9c05c2cafb865a095a21e8a977bf972c4695))

### [3.0.52](https://github.com/Pocket/terraform-modules/compare/v3.0.51...v3.0.52) (2021-12-30)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.99 to 0.2.105 ([#697](https://github.com/Pocket/terraform-modules/issues/697)) ([a9b1e13](https://github.com/Pocket/terraform-modules/commit/a9b1e131d79f41b7b3dbc88ef0c5897bd390aa4b))

### [3.0.51](https://github.com/Pocket/terraform-modules/compare/v3.0.50...v3.0.51) (2021-12-29)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.84 to 0.2.90 ([#690](https://github.com/Pocket/terraform-modules/issues/690)) ([afb78e5](https://github.com/Pocket/terraform-modules/commit/afb78e56a4ef4ff68d0d0d47e2f0eae06bdfdf19))

### [3.0.50](https://github.com/Pocket/terraform-modules/compare/v3.0.49...v3.0.50) (2021-12-29)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.91 to 0.2.98 ([#691](https://github.com/Pocket/terraform-modules/issues/691)) ([a663ff7](https://github.com/Pocket/terraform-modules/commit/a663ff7915833cbbc48bfff3335e7e460d967fea))

### [3.0.49](https://github.com/Pocket/terraform-modules/compare/v3.0.48...v3.0.49) (2021-12-29)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.94 to 0.2.101 ([#692](https://github.com/Pocket/terraform-modules/issues/692)) ([6b00f9d](https://github.com/Pocket/terraform-modules/commit/6b00f9d980aa867e60a287ceb570204986689f4f))

### [3.0.48](https://github.com/Pocket/terraform-modules/compare/v3.0.47...v3.0.48) (2021-12-29)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.93 to 0.2.99 ([#693](https://github.com/Pocket/terraform-modules/issues/693)) ([6d02bda](https://github.com/Pocket/terraform-modules/commit/6d02bda62c1ee416a05003f9e1e9452bf8174dc5))

### [3.0.47](https://github.com/Pocket/terraform-modules/compare/v3.0.46...v3.0.47) (2021-12-29)


### Bug Fixes

* **deps:** bump constructs from 10.0.16 to 10.0.17 ([#684](https://github.com/Pocket/terraform-modules/issues/684)) ([0dbb019](https://github.com/Pocket/terraform-modules/commit/0dbb0198168d2c05968910c12f85116e40702941))

### [3.0.46](https://github.com/Pocket/terraform-modules/compare/v3.0.45...v3.0.46) (2021-12-29)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.89 to 0.4.95 ([#685](https://github.com/Pocket/terraform-modules/issues/685)) ([9ab310e](https://github.com/Pocket/terraform-modules/commit/9ab310e521de9038ce9c51c4941fc59c35262d67))

### [3.0.45](https://github.com/Pocket/terraform-modules/compare/v3.0.44...v3.0.45) (2021-12-28)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.87 to 0.2.93 ([#681](https://github.com/Pocket/terraform-modules/issues/681)) ([e400838](https://github.com/Pocket/terraform-modules/commit/e4008387410bc33a915067cd34b57618784aea20))

### [3.0.44](https://github.com/Pocket/terraform-modules/compare/v3.0.43...v3.0.44) (2021-12-28)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.79 to 0.2.84 ([#682](https://github.com/Pocket/terraform-modules/issues/682)) ([aee3ae5](https://github.com/Pocket/terraform-modules/commit/aee3ae55ae098d3a24eac32dc8d0b5ed4d66c392))

### [3.0.43](https://github.com/Pocket/terraform-modules/compare/v3.0.42...v3.0.43) (2021-12-28)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.83 to 0.4.89 ([#680](https://github.com/Pocket/terraform-modules/issues/680)) ([d5406eb](https://github.com/Pocket/terraform-modules/commit/d5406ebf0b3550b68a766199fff8690842675810))

### [3.0.42](https://github.com/Pocket/terraform-modules/compare/v3.0.41...v3.0.42) (2021-12-28)


### Bug Fixes

* **deps:** bump constructs from 10.0.15 to 10.0.16 ([#675](https://github.com/Pocket/terraform-modules/issues/675)) ([122be31](https://github.com/Pocket/terraform-modules/commit/122be3113bc2c74d5eccba62281bccd203d2c30a))

### [3.0.41](https://github.com/Pocket/terraform-modules/compare/v3.0.40...v3.0.41) (2021-12-28)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.85 to 0.2.91 ([#678](https://github.com/Pocket/terraform-modules/issues/678)) ([ac1a08a](https://github.com/Pocket/terraform-modules/commit/ac1a08a4590118020d0edfdb4020be9f01927b22))

### [3.0.40](https://github.com/Pocket/terraform-modules/compare/v3.0.39...v3.0.40) (2021-12-28)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.87 to 0.2.94 ([#679](https://github.com/Pocket/terraform-modules/issues/679)) ([0904cdb](https://github.com/Pocket/terraform-modules/commit/0904cdb3b63f93f1de93f10e301e5416d1f19a1f))

### [3.0.39](https://github.com/Pocket/terraform-modules/compare/v3.0.38...v3.0.39) (2021-12-27)


### Bug Fixes

* **deps:** bump constructs from 10.0.13 to 10.0.15 ([#665](https://github.com/Pocket/terraform-modules/issues/665)) ([ed267d0](https://github.com/Pocket/terraform-modules/commit/ed267d081fb8a6154163e33956359b8f5acb3ae3))

### [3.0.38](https://github.com/Pocket/terraform-modules/compare/v3.0.37...v3.0.38) (2021-12-27)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.68 to 0.2.87 ([#671](https://github.com/Pocket/terraform-modules/issues/671)) ([0c7fea9](https://github.com/Pocket/terraform-modules/commit/0c7fea99321ece37a93fdef848afc96d0d679453))

### [3.0.37](https://github.com/Pocket/terraform-modules/compare/v3.0.36...v3.0.37) (2021-12-27)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.59 to 0.2.87 ([#672](https://github.com/Pocket/terraform-modules/issues/672)) ([ee2fd4d](https://github.com/Pocket/terraform-modules/commit/ee2fd4d02539899402bbf7b71a6c0ac3b69d61bb))

### [3.0.36](https://github.com/Pocket/terraform-modules/compare/v3.0.35...v3.0.36) (2021-12-27)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.65 to 0.2.85 ([#669](https://github.com/Pocket/terraform-modules/issues/669)) ([1baaa98](https://github.com/Pocket/terraform-modules/commit/1baaa98089bef3463dd9131358e07aecc674ae25))

### [3.0.35](https://github.com/Pocket/terraform-modules/compare/v3.0.34...v3.0.35) (2021-12-27)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.64 to 0.4.83 ([#667](https://github.com/Pocket/terraform-modules/issues/667)) ([35ae48a](https://github.com/Pocket/terraform-modules/commit/35ae48a03bd848b1b100a5fee362747dd5bbeebe))

### [3.0.34](https://github.com/Pocket/terraform-modules/compare/v3.0.33...v3.0.34) (2021-12-27)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.61 to 0.2.79 ([#664](https://github.com/Pocket/terraform-modules/issues/664)) ([7db3357](https://github.com/Pocket/terraform-modules/commit/7db33571516238d85ac1a2a829a611808c52853e))

### [3.0.33](https://github.com/Pocket/terraform-modules/compare/v3.0.32...v3.0.33) (2021-12-24)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.60 to 0.2.68 ([#663](https://github.com/Pocket/terraform-modules/issues/663)) ([0157d2c](https://github.com/Pocket/terraform-modules/commit/0157d2c5795b6a18ad88df34ec3d695505ed52b0))

### [3.0.32](https://github.com/Pocket/terraform-modules/compare/v3.0.31...v3.0.32) (2021-12-24)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.57 to 0.4.64 ([#662](https://github.com/Pocket/terraform-modules/issues/662)) ([0a67650](https://github.com/Pocket/terraform-modules/commit/0a67650b88daaf2cdf70423cab2f9135873e0461))

### [3.0.31](https://github.com/Pocket/terraform-modules/compare/v3.0.30...v3.0.31) (2021-12-24)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.55 to 0.2.61 ([#661](https://github.com/Pocket/terraform-modules/issues/661)) ([0fb0a80](https://github.com/Pocket/terraform-modules/commit/0fb0a8045e5fafe1dae55526efa86a3fd750cd27))

### [3.0.30](https://github.com/Pocket/terraform-modules/compare/v3.0.29...v3.0.30) (2021-12-24)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.59 to 0.2.65 ([#656](https://github.com/Pocket/terraform-modules/issues/656)) ([c4b3314](https://github.com/Pocket/terraform-modules/commit/c4b3314cda9ba938d3ee0e73e54515938b878c6c))

### [3.0.29](https://github.com/Pocket/terraform-modules/compare/v3.0.28...v3.0.29) (2021-12-23)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.53 to 0.2.59 ([#654](https://github.com/Pocket/terraform-modules/issues/654)) ([205ee86](https://github.com/Pocket/terraform-modules/commit/205ee86af9d38d6135130336f0abe6c40e0eea7f))

### [3.0.28](https://github.com/Pocket/terraform-modules/compare/v3.0.27...v3.0.28) (2021-12-23)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.53 to 0.2.59 ([#655](https://github.com/Pocket/terraform-modules/issues/655)) ([52c7489](https://github.com/Pocket/terraform-modules/commit/52c74899f69129dc04a991ff66113c907d9da3ee))

### [3.0.27](https://github.com/Pocket/terraform-modules/compare/v3.0.26...v3.0.27) (2021-12-23)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.49 to 0.2.55 ([#651](https://github.com/Pocket/terraform-modules/issues/651)) ([ff710bc](https://github.com/Pocket/terraform-modules/commit/ff710bc01df7e7f501cb570c89e583951fba9236))

### [3.0.26](https://github.com/Pocket/terraform-modules/compare/v3.0.25...v3.0.26) (2021-12-23)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.50 to 0.4.57 ([#653](https://github.com/Pocket/terraform-modules/issues/653)) ([994dd75](https://github.com/Pocket/terraform-modules/commit/994dd7545566484eb4b26c480aa285337b281d92))

### [3.0.25](https://github.com/Pocket/terraform-modules/compare/v3.0.24...v3.0.25) (2021-12-23)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.54 to 0.2.60 ([#647](https://github.com/Pocket/terraform-modules/issues/647)) ([704943f](https://github.com/Pocket/terraform-modules/commit/704943f5692dee419f0ca6e8e53339043c310a92))

### [3.0.24](https://github.com/Pocket/terraform-modules/compare/v3.0.23...v3.0.24) (2021-12-22)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.47 to 0.2.53 ([#643](https://github.com/Pocket/terraform-modules/issues/643)) ([df4fb1d](https://github.com/Pocket/terraform-modules/commit/df4fb1de805cdd13e219ad1255124cfbff0e20c3))

### [3.0.23](https://github.com/Pocket/terraform-modules/compare/v3.0.22...v3.0.23) (2021-12-22)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.47 to 0.2.54 ([#645](https://github.com/Pocket/terraform-modules/issues/645)) ([818764e](https://github.com/Pocket/terraform-modules/commit/818764efcbd36b737b263abf24a71304436ceb37))

### [3.0.22](https://github.com/Pocket/terraform-modules/compare/v3.0.21...v3.0.22) (2021-12-22)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.47 to 0.2.53 ([#642](https://github.com/Pocket/terraform-modules/issues/642)) ([b6ec1da](https://github.com/Pocket/terraform-modules/commit/b6ec1daa5bf6b9064a44e2c0743a960d694a2620))

### [3.0.21](https://github.com/Pocket/terraform-modules/compare/v3.0.20...v3.0.21) (2021-12-22)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.43 to 0.2.49 ([#641](https://github.com/Pocket/terraform-modules/issues/641)) ([6a59dd4](https://github.com/Pocket/terraform-modules/commit/6a59dd4e5e39e9034ddb9ddb145fe1370852eadd))

### [3.0.20](https://github.com/Pocket/terraform-modules/compare/v3.0.19...v3.0.20) (2021-12-22)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.45 to 0.4.50 ([#638](https://github.com/Pocket/terraform-modules/issues/638)) ([ce5413d](https://github.com/Pocket/terraform-modules/commit/ce5413d7d6fe87faa35f4463c52f32a9a42e8aa5))

### [3.0.19](https://github.com/Pocket/terraform-modules/compare/v3.0.18...v3.0.19) (2021-12-21)


### Bug Fixes

* **deps:** bump constructs from 10.0.12 to 10.0.13 ([#636](https://github.com/Pocket/terraform-modules/issues/636)) ([f3df0a8](https://github.com/Pocket/terraform-modules/commit/f3df0a875dcdd7827f3b68e836716b37856ef2c6))

### [3.0.18](https://github.com/Pocket/terraform-modules/compare/v3.0.17...v3.0.18) (2021-12-21)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.46 to 0.2.47 ([#635](https://github.com/Pocket/terraform-modules/issues/635)) ([e2331f1](https://github.com/Pocket/terraform-modules/commit/e2331f1fdd0799e4b4d489826b709f451155208a))

### [3.0.17](https://github.com/Pocket/terraform-modules/compare/v3.0.16...v3.0.17) (2021-12-21)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.39 to 0.2.47 ([#632](https://github.com/Pocket/terraform-modules/issues/632)) ([2eb580c](https://github.com/Pocket/terraform-modules/commit/2eb580ca8ca6948dc37e59eb6ebc1603c3f42f00))

### [3.0.16](https://github.com/Pocket/terraform-modules/compare/v3.0.15...v3.0.16) (2021-12-21)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.39 to 0.2.47 ([#633](https://github.com/Pocket/terraform-modules/issues/633)) ([8374f82](https://github.com/Pocket/terraform-modules/commit/8374f8288fab041bd63fdb472fc46b64c62706e8))

### [3.0.15](https://github.com/Pocket/terraform-modules/compare/v3.0.14...v3.0.15) (2021-12-21)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.35 to 0.2.43 ([#631](https://github.com/Pocket/terraform-modules/issues/631)) ([a07d4aa](https://github.com/Pocket/terraform-modules/commit/a07d4aab0c029730f1311346d990aec4206dea66))

### [3.0.14](https://github.com/Pocket/terraform-modules/compare/v3.0.13...v3.0.14) (2021-12-21)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.38 to 0.4.45 ([#627](https://github.com/Pocket/terraform-modules/issues/627)) ([cce6289](https://github.com/Pocket/terraform-modules/commit/cce6289db759eab44bf96da3d1c27c4e44dcb05a))

### [3.0.13](https://github.com/Pocket/terraform-modules/compare/v3.0.12...v3.0.13) (2021-12-21)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.38 to 0.2.46 ([#625](https://github.com/Pocket/terraform-modules/issues/625)) ([952b9f1](https://github.com/Pocket/terraform-modules/commit/952b9f1623dbb09c671265ba11f7ff91932538a8))

### [3.0.12](https://github.com/Pocket/terraform-modules/compare/v3.0.11...v3.0.12) (2021-12-20)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.17 to 0.4.38 ([#622](https://github.com/Pocket/terraform-modules/issues/622)) ([495e734](https://github.com/Pocket/terraform-modules/commit/495e73467ded933544e4ff46e48704488cf6835d))

### [3.0.11](https://github.com/Pocket/terraform-modules/compare/v3.0.10...v3.0.11) (2021-12-20)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.18 to 0.2.39 ([#621](https://github.com/Pocket/terraform-modules/issues/621)) ([33a3838](https://github.com/Pocket/terraform-modules/commit/33a3838fe556433a005c71d2d1fc8b8376385042))

### [3.0.10](https://github.com/Pocket/terraform-modules/compare/v3.0.9...v3.0.10) (2021-12-20)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.16 to 0.2.35 ([#624](https://github.com/Pocket/terraform-modules/issues/624)) ([0e792f0](https://github.com/Pocket/terraform-modules/commit/0e792f0ea15bf9f2bb4cdb380add602d896acb9c))

### [3.0.9](https://github.com/Pocket/terraform-modules/compare/v3.0.8...v3.0.9) (2021-12-20)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.18 to 0.2.39 ([#623](https://github.com/Pocket/terraform-modules/issues/623)) ([6be14bb](https://github.com/Pocket/terraform-modules/commit/6be14bb9afa67959e8063348407d03d0f7ddc5ac))

### [3.0.8](https://github.com/Pocket/terraform-modules/compare/v3.0.7...v3.0.8) (2021-12-20)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.18 to 0.2.38 ([#617](https://github.com/Pocket/terraform-modules/issues/617)) ([f37dfeb](https://github.com/Pocket/terraform-modules/commit/f37dfeb03045a54367374bc42feca7382c619d5d))

### [3.0.7](https://github.com/Pocket/terraform-modules/compare/v3.0.6...v3.0.7) (2021-12-17)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.17 to 0.2.18 ([#614](https://github.com/Pocket/terraform-modules/issues/614)) ([2408f90](https://github.com/Pocket/terraform-modules/commit/2408f90b7601a2e849d0c1ec5602f7afa6a0b221))

### [3.0.6](https://github.com/Pocket/terraform-modules/compare/v3.0.5...v3.0.6) (2021-12-17)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.2.14 to 0.2.18 ([#610](https://github.com/Pocket/terraform-modules/issues/610)) ([7184f67](https://github.com/Pocket/terraform-modules/commit/7184f67d632727203e0f50dec827ca7ce2a70a4e))

### [3.0.5](https://github.com/Pocket/terraform-modules/compare/v3.0.4...v3.0.5) (2021-12-17)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.15 to 0.2.16 ([#612](https://github.com/Pocket/terraform-modules/issues/612)) ([b428f12](https://github.com/Pocket/terraform-modules/commit/b428f12599dc8000a723452396f53a3e2bd1f2d2))

### [3.0.4](https://github.com/Pocket/terraform-modules/compare/v3.0.3...v3.0.4) (2021-12-17)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.2.14 to 0.2.18 ([#613](https://github.com/Pocket/terraform-modules/issues/613)) ([82d645d](https://github.com/Pocket/terraform-modules/commit/82d645da0ee747da406b27b568a99f77f21bc7ca))

### [3.0.3](https://github.com/Pocket/terraform-modules/compare/v3.0.2...v3.0.3) (2021-12-17)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.4.13 to 0.4.17 ([#611](https://github.com/Pocket/terraform-modules/issues/611)) ([af4af38](https://github.com/Pocket/terraform-modules/commit/af4af38e05ed62fcee8a070b2604a54792db9e03))

### [3.0.2](https://github.com/Pocket/terraform-modules/compare/v3.0.1...v3.0.2) (2021-12-17)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.2.14 to 0.2.17 ([#605](https://github.com/Pocket/terraform-modules/issues/605)) ([6185888](https://github.com/Pocket/terraform-modules/commit/6185888f1f94c862d4f93314c1f980e39f1e826c))

### [3.0.1](https://github.com/Pocket/terraform-modules/compare/v3.0.0...v3.0.1) (2021-12-17)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.2.12 to 0.2.15 ([#607](https://github.com/Pocket/terraform-modules/issues/607)) ([7190407](https://github.com/Pocket/terraform-modules/commit/719040725ffad6eae9d0b92e39279af55e4e35bb))

## [3.0.0](https://github.com/Pocket/terraform-modules/compare/v2.4.2...v3.0.0) (2021-12-16)


### ⚠ BREAKING CHANGES

* **cdktf:** Please note that CDK for Terraform 0.8 contains breaking changes that will require code updates for namespacing AWS provider resources

* feat(cdktf): bump cdktf to 0.8.1

* fix(cdktf): fixes for cdktf 0.8.1

* feat(cdktf): bump cdktf providers

* fix(cdktf): fixes for cdktf 0.8.3

### Features

* **cdktf:** bump cdktf to 0.8 ([#584](https://github.com/Pocket/terraform-modules/issues/584)) ([f8113fe](https://github.com/Pocket/terraform-modules/commit/f8113fead51684fceabad3785fa1f78c00283dec))

### [2.4.2](https://github.com/Pocket/terraform-modules/compare/v2.4.1...v2.4.2) (2021-12-13)


### Bug Fixes

* **deps:** bump constructs from 10.0.10 to 10.0.12 ([#596](https://github.com/Pocket/terraform-modules/issues/596)) ([8d48fa2](https://github.com/Pocket/terraform-modules/commit/8d48fa2e77e58fa4e0aa3443ce81347c48d8102b))

### [2.4.1](https://github.com/Pocket/terraform-modules/compare/v2.4.0...v2.4.1) (2021-12-06)


### Bug Fixes

* **deps:** bump constructs from 10.0.9 to 10.0.10 ([#585](https://github.com/Pocket/terraform-modules/issues/585)) ([384925e](https://github.com/Pocket/terraform-modules/commit/384925e201dddde32450c479f91daa7ed745d49a))

## [2.4.0](https://github.com/Pocket/terraform-modules/compare/v2.3.10...v2.4.0) (2021-12-03)


### Features

* **api-gateway:** adding route53 to pocket api gateway construct.  ([#568](https://github.com/Pocket/terraform-modules/issues/568)) ([b15faed](https://github.com/Pocket/terraform-modules/commit/b15faedea570f4a0d6887f36a93f1caaacdf8ca8))

### [2.3.10](https://github.com/Pocket/terraform-modules/compare/v2.3.9...v2.3.10) (2021-12-02)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.258 to 0.0.261 ([#583](https://github.com/Pocket/terraform-modules/issues/583)) ([68b06d4](https://github.com/Pocket/terraform-modules/commit/68b06d424ce3e3b6559c29c5b3c4405e4851d716))

### [2.3.9](https://github.com/Pocket/terraform-modules/compare/v2.3.8...v2.3.9) (2021-12-02)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.231 to 0.0.234 ([#578](https://github.com/Pocket/terraform-modules/issues/578)) ([4fe1149](https://github.com/Pocket/terraform-modules/commit/4fe11492747f2f943b01f57c4d30ce20e97d0e1e))

### [2.3.8](https://github.com/Pocket/terraform-modules/compare/v2.3.7...v2.3.8) (2021-12-02)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.259 to 0.2.262 ([#580](https://github.com/Pocket/terraform-modules/issues/580)) ([4d22702](https://github.com/Pocket/terraform-modules/commit/4d22702b1dbf2b08ebb310e67913a61ab58efa67))

### [2.3.7](https://github.com/Pocket/terraform-modules/compare/v2.3.6...v2.3.7) (2021-12-02)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.253 to 0.0.256 ([#582](https://github.com/Pocket/terraform-modules/issues/582)) ([ddadfa1](https://github.com/Pocket/terraform-modules/commit/ddadfa1c986ca04598dd09ad57b2733e3a88063d))

### [2.3.6](https://github.com/Pocket/terraform-modules/compare/v2.3.5...v2.3.6) (2021-12-02)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.0.90 to 0.0.94 ([#579](https://github.com/Pocket/terraform-modules/issues/579)) ([160b635](https://github.com/Pocket/terraform-modules/commit/160b63581940988ffe19ce6acb7a94e63bbbdb55))

### [2.3.5](https://github.com/Pocket/terraform-modules/compare/v2.3.4...v2.3.5) (2021-12-01)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.252 to 0.0.258 ([#575](https://github.com/Pocket/terraform-modules/issues/575)) ([ab1a2b8](https://github.com/Pocket/terraform-modules/commit/ab1a2b837fa9ade14df5644a54916aa90b46304a))

### [2.3.4](https://github.com/Pocket/terraform-modules/compare/v2.3.3...v2.3.4) (2021-12-01)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.252 to 0.2.259 ([#577](https://github.com/Pocket/terraform-modules/issues/577)) ([930c026](https://github.com/Pocket/terraform-modules/commit/930c026c1d8b3396c461e0b9753378718357bd7d))

### [2.3.3](https://github.com/Pocket/terraform-modules/compare/v2.3.2...v2.3.3) (2021-12-01)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.241 to 0.0.253 ([#576](https://github.com/Pocket/terraform-modules/issues/576)) ([0c31827](https://github.com/Pocket/terraform-modules/commit/0c318275a95f576444dcd31014f02ed614f937ed))

### [2.3.2](https://github.com/Pocket/terraform-modules/compare/v2.3.1...v2.3.2) (2021-12-01)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.224 to 0.0.231 ([#574](https://github.com/Pocket/terraform-modules/issues/574)) ([9cfa26b](https://github.com/Pocket/terraform-modules/commit/9cfa26b2cdc1ad33115fd4dda71083e224ca717c))

### [2.3.1](https://github.com/Pocket/terraform-modules/compare/v2.3.0...v2.3.1) (2021-12-01)


### Bug Fixes

* **deps:** bump @cdktf/provider-newrelic from 0.0.48 to 0.0.90 ([#569](https://github.com/Pocket/terraform-modules/issues/569)) ([ac6ce92](https://github.com/Pocket/terraform-modules/commit/ac6ce926c106928293550d44829462bec94f8519))

## [2.3.0](https://github.com/Pocket/terraform-modules/compare/v2.2.30...v2.3.0) (2021-11-30)


### Features

* **NewRelic:** Synthetics integration ([#484](https://github.com/Pocket/terraform-modules/issues/484)) ([5d5de9d](https://github.com/Pocket/terraform-modules/commit/5d5de9da514d4f848ca7df2de1f4a12bdf0f8bed))

### [2.2.30](https://github.com/Pocket/terraform-modules/compare/v2.2.29...v2.2.30) (2021-11-30)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.223 to 0.0.224 ([#564](https://github.com/Pocket/terraform-modules/issues/564)) ([d788681](https://github.com/Pocket/terraform-modules/commit/d78868129f2677e7558ceab116095038af472a12))

### [2.2.29](https://github.com/Pocket/terraform-modules/compare/v2.2.28...v2.2.29) (2021-11-30)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.246 to 0.2.252 ([#562](https://github.com/Pocket/terraform-modules/issues/562)) ([16a236f](https://github.com/Pocket/terraform-modules/commit/16a236f44b64cd2ae190f1b1cfc392d5d24efb63))

### [2.2.28](https://github.com/Pocket/terraform-modules/compare/v2.2.27...v2.2.28) (2021-11-30)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.244 to 0.0.252 ([#563](https://github.com/Pocket/terraform-modules/issues/563)) ([8497d61](https://github.com/Pocket/terraform-modules/commit/8497d6140910a90db37bec26de6d248e00f40b0b))

### [2.2.27](https://github.com/Pocket/terraform-modules/compare/v2.2.26...v2.2.27) (2021-11-30)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.217 to 0.0.223 ([#556](https://github.com/Pocket/terraform-modules/issues/556)) ([0c58b35](https://github.com/Pocket/terraform-modules/commit/0c58b353898bc3ab25b68193ec677639c2441e41))

### [2.2.26](https://github.com/Pocket/terraform-modules/compare/v2.2.25...v2.2.26) (2021-11-29)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.220 to 0.0.241 ([#553](https://github.com/Pocket/terraform-modules/issues/553)) ([f42565e](https://github.com/Pocket/terraform-modules/commit/f42565ec98bccd4b513a32c0e18dcbccb80b59d4))

### [2.2.25](https://github.com/Pocket/terraform-modules/compare/v2.2.24...v2.2.25) (2021-11-29)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.224 to 0.2.246 ([#554](https://github.com/Pocket/terraform-modules/issues/554)) ([2eca64e](https://github.com/Pocket/terraform-modules/commit/2eca64e99770a9f470efea67b10400fe8ea305ef))

### [2.2.24](https://github.com/Pocket/terraform-modules/compare/v2.2.23...v2.2.24) (2021-11-29)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.223 to 0.0.244 ([#552](https://github.com/Pocket/terraform-modules/issues/552)) ([a39040d](https://github.com/Pocket/terraform-modules/commit/a39040ddf867c7262492cdf4d7001af43e173d3d))

### [2.2.23](https://github.com/Pocket/terraform-modules/compare/v2.2.22...v2.2.23) (2021-11-29)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.201 to 0.0.217 ([#549](https://github.com/Pocket/terraform-modules/issues/549)) ([f2484b9](https://github.com/Pocket/terraform-modules/commit/f2484b99a40bafb7f70fe5fdbabf1e722ae8f5f2))

### [2.2.22](https://github.com/Pocket/terraform-modules/compare/v2.2.21...v2.2.22) (2021-11-26)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.212 to 0.0.220 ([#548](https://github.com/Pocket/terraform-modules/issues/548)) ([466aa19](https://github.com/Pocket/terraform-modules/commit/466aa1960c43333458a02449a2444f799457fdae))

### [2.2.21](https://github.com/Pocket/terraform-modules/compare/v2.2.20...v2.2.21) (2021-11-26)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.195 to 0.0.201 ([#547](https://github.com/Pocket/terraform-modules/issues/547)) ([df298a5](https://github.com/Pocket/terraform-modules/commit/df298a5ed23723d2295dc6d8bcf68e989ce998a8))

### [2.2.20](https://github.com/Pocket/terraform-modules/compare/v2.2.19...v2.2.20) (2021-11-26)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.218 to 0.2.224 ([#544](https://github.com/Pocket/terraform-modules/issues/544)) ([49ae32e](https://github.com/Pocket/terraform-modules/commit/49ae32e80f64f2a695cf34da2058f9a2ae730a19))

### [2.2.19](https://github.com/Pocket/terraform-modules/compare/v2.2.18...v2.2.19) (2021-11-26)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.218 to 0.0.223 ([#542](https://github.com/Pocket/terraform-modules/issues/542)) ([56482f8](https://github.com/Pocket/terraform-modules/commit/56482f873d172adebdefdeff262aae8d95e19c8d))

### [2.2.18](https://github.com/Pocket/terraform-modules/compare/v2.2.17...v2.2.18) (2021-11-25)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.211 to 0.0.218 ([#541](https://github.com/Pocket/terraform-modules/issues/541)) ([fb5bab0](https://github.com/Pocket/terraform-modules/commit/fb5bab04c9e66efbfda25448fcf635e4066639d0))

### [2.2.17](https://github.com/Pocket/terraform-modules/compare/v2.2.16...v2.2.17) (2021-11-25)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.204 to 0.2.218 ([#540](https://github.com/Pocket/terraform-modules/issues/540)) ([112453a](https://github.com/Pocket/terraform-modules/commit/112453a637a0061ee60d52d52241d2fcad9c5e6f))

### [2.2.16](https://github.com/Pocket/terraform-modules/compare/v2.2.15...v2.2.16) (2021-11-25)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.188 to 0.0.195 ([#539](https://github.com/Pocket/terraform-modules/issues/539)) ([d185c79](https://github.com/Pocket/terraform-modules/commit/d185c790771768b4772e6579375a156c59a5219f))

### [2.2.15](https://github.com/Pocket/terraform-modules/compare/v2.2.14...v2.2.15) (2021-11-25)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.206 to 0.0.212 ([#536](https://github.com/Pocket/terraform-modules/issues/536)) ([55f1d0b](https://github.com/Pocket/terraform-modules/commit/55f1d0bbaaa2b6d458dcab20ba3225c44af92da4))

### [2.2.14](https://github.com/Pocket/terraform-modules/compare/v2.2.13...v2.2.14) (2021-11-24)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.203 to 0.0.211 ([#532](https://github.com/Pocket/terraform-modules/issues/532)) ([b84cb81](https://github.com/Pocket/terraform-modules/commit/b84cb81697bc1f4a8b44d33c1099e859e01f5760))

### [2.2.13](https://github.com/Pocket/terraform-modules/compare/v2.2.12...v2.2.13) (2021-11-24)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.199 to 0.0.206 ([#531](https://github.com/Pocket/terraform-modules/issues/531)) ([99abedb](https://github.com/Pocket/terraform-modules/commit/99abedb014afa288ef2c5241a748c7788aae4206))

### [2.2.12](https://github.com/Pocket/terraform-modules/compare/v2.2.11...v2.2.12) (2021-11-24)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.181 to 0.0.188 ([#526](https://github.com/Pocket/terraform-modules/issues/526)) ([a3ec093](https://github.com/Pocket/terraform-modules/commit/a3ec09394e5766c95a144f21ed06217f644798d2))

### [2.2.11](https://github.com/Pocket/terraform-modules/compare/v2.2.10...v2.2.11) (2021-11-23)


### Bug Fixes

* **api-gateway:** add lifecycle property to api gateway ([#525](https://github.com/Pocket/terraform-modules/issues/525)) ([727707a](https://github.com/Pocket/terraform-modules/commit/727707a1770ba892be4d65a595b17f321b6d8562))

### [2.2.10](https://github.com/Pocket/terraform-modules/compare/v2.2.9...v2.2.10) (2021-11-23)


### Bug Fixes

* **api gateway lambda integration:** Fix redeployment trigger ([#518](https://github.com/Pocket/terraform-modules/issues/518)) ([b35cd08](https://github.com/Pocket/terraform-modules/commit/b35cd081b0f90590e5748d0c83e01627b7445d63))

### [2.2.9](https://github.com/Pocket/terraform-modules/compare/v2.2.8...v2.2.9) (2021-11-23)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.192 to 0.0.199 ([#523](https://github.com/Pocket/terraform-modules/issues/523)) ([1c9aa17](https://github.com/Pocket/terraform-modules/commit/1c9aa177dceba9a0bfb9f20abee36e71054d375c))

### [2.2.8](https://github.com/Pocket/terraform-modules/compare/v2.2.7...v2.2.8) (2021-11-23)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.197 to 0.2.204 ([#524](https://github.com/Pocket/terraform-modules/issues/524)) ([2da4729](https://github.com/Pocket/terraform-modules/commit/2da472903437e347315f4492101a6c49c68e1eab))

### [2.2.7](https://github.com/Pocket/terraform-modules/compare/v2.2.6...v2.2.7) (2021-11-23)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.196 to 0.0.203 ([#522](https://github.com/Pocket/terraform-modules/issues/522)) ([57a68cf](https://github.com/Pocket/terraform-modules/commit/57a68cfa1cd40d0f97319c8664a602f7f8587ad8))

### [2.2.6](https://github.com/Pocket/terraform-modules/compare/v2.2.5...v2.2.6) (2021-11-23)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.176 to 0.0.181 ([#520](https://github.com/Pocket/terraform-modules/issues/520)) ([7f30cc6](https://github.com/Pocket/terraform-modules/commit/7f30cc6376ca3d8882255dcde67592197b932c54))

### [2.2.5](https://github.com/Pocket/terraform-modules/compare/v2.2.4...v2.2.5) (2021-11-22)


### Bug Fixes

* **types:** Export the PocketApiGatewayLambdaIntegration class and its types ([#517](https://github.com/Pocket/terraform-modules/issues/517)) ([cac1f12](https://github.com/Pocket/terraform-modules/commit/cac1f12524db1226c005f3b1bbe8bcf56094d531))

### [2.2.4](https://github.com/Pocket/terraform-modules/compare/v2.2.3...v2.2.4) (2021-11-22)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.179 to 0.2.197 ([#514](https://github.com/Pocket/terraform-modules/issues/514)) ([61261ff](https://github.com/Pocket/terraform-modules/commit/61261ff0f2146e826d1803f2b34ac744920dfc6e))

### [2.2.3](https://github.com/Pocket/terraform-modules/compare/v2.2.2...v2.2.3) (2021-11-22)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.173 to 0.0.192 ([#516](https://github.com/Pocket/terraform-modules/issues/516)) ([ee5c03c](https://github.com/Pocket/terraform-modules/commit/ee5c03c249e1147d9ddef1f3a464d7a595cf7f5e))

### [2.2.2](https://github.com/Pocket/terraform-modules/compare/v2.2.1...v2.2.2) (2021-11-22)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.159 to 0.0.176 ([#515](https://github.com/Pocket/terraform-modules/issues/515)) ([6043861](https://github.com/Pocket/terraform-modules/commit/60438619307f3472057f2a8dea631b5a9f4187c8))

### [2.2.1](https://github.com/Pocket/terraform-modules/compare/v2.2.0...v2.2.1) (2021-11-22)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.177 to 0.0.196 ([#508](https://github.com/Pocket/terraform-modules/issues/508)) ([791e022](https://github.com/Pocket/terraform-modules/commit/791e022714d6284334f1a1f322809f6148cbe90d))

## [2.2.0](https://github.com/Pocket/terraform-modules/compare/v2.1.0...v2.2.0) (2021-11-19)


### Features

* **api gateway:** Pocket api gateway construct with lambda proxy integrations ([#486](https://github.com/Pocket/terraform-modules/issues/486)) ([93d1c33](https://github.com/Pocket/terraform-modules/commit/93d1c33caabf50b20f5ac63173397d064824e815))

## [2.1.0](https://github.com/Pocket/terraform-modules/compare/v2.0.41...v2.1.0) (2021-11-19)


### Features

* **CloudwatchAlarm:** Allow configuring Alarm Description ([#506](https://github.com/Pocket/terraform-modules/issues/506)) ([f22a8aa](https://github.com/Pocket/terraform-modules/commit/f22a8aa8eb864ea9787e3013b3e1c3cb9b5f0b12))

### [2.0.41](https://github.com/Pocket/terraform-modules/compare/v2.0.40...v2.0.41) (2021-11-19)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.158 to 0.0.159 ([#505](https://github.com/Pocket/terraform-modules/issues/505)) ([c26337c](https://github.com/Pocket/terraform-modules/commit/c26337cc5d683f63d752e6e80f02498ee3d9c9b6))

### [2.0.40](https://github.com/Pocket/terraform-modules/compare/v2.0.39...v2.0.40) (2021-11-19)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.165 to 0.0.173 ([#502](https://github.com/Pocket/terraform-modules/issues/502)) ([c7e3ec9](https://github.com/Pocket/terraform-modules/commit/c7e3ec9f0c1438a7d9ca12b2d31d221ffec3b6ad))

### [2.0.39](https://github.com/Pocket/terraform-modules/compare/v2.0.38...v2.0.39) (2021-11-19)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.172 to 0.2.179 ([#504](https://github.com/Pocket/terraform-modules/issues/504)) ([2e76684](https://github.com/Pocket/terraform-modules/commit/2e766841884dfd83e6f7f49e79ecc86090813980))

### [2.0.38](https://github.com/Pocket/terraform-modules/compare/v2.0.37...v2.0.38) (2021-11-19)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.170 to 0.0.177 ([#503](https://github.com/Pocket/terraform-modules/issues/503)) ([d7103a3](https://github.com/Pocket/terraform-modules/commit/d7103a361864493d0e4371d631749437428725b6))

### [2.0.37](https://github.com/Pocket/terraform-modules/compare/v2.0.36...v2.0.37) (2021-11-19)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.152 to 0.0.158 ([#498](https://github.com/Pocket/terraform-modules/issues/498)) ([b1ffd71](https://github.com/Pocket/terraform-modules/commit/b1ffd71522f0c83448851a3bb649388979d31170))

### [2.0.36](https://github.com/Pocket/terraform-modules/compare/v2.0.35...v2.0.36) (2021-11-18)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.161 to 0.0.170 ([#493](https://github.com/Pocket/terraform-modules/issues/493)) ([4096e4f](https://github.com/Pocket/terraform-modules/commit/4096e4fe5fa68cb38708f1b64591ba7abb98aff8))

### [2.0.35](https://github.com/Pocket/terraform-modules/compare/v2.0.34...v2.0.35) (2021-11-18)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.156 to 0.2.172 ([#494](https://github.com/Pocket/terraform-modules/issues/494)) ([53d428f](https://github.com/Pocket/terraform-modules/commit/53d428fd27249b576ec37d9fd71d2b848933cdf7))

### [2.0.34](https://github.com/Pocket/terraform-modules/compare/v2.0.33...v2.0.34) (2021-11-18)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.137 to 0.0.152 ([#492](https://github.com/Pocket/terraform-modules/issues/492)) ([b92bd7e](https://github.com/Pocket/terraform-modules/commit/b92bd7e908197ce8e1a2e1c5981d6e4ee32c2c14))

### [2.0.33](https://github.com/Pocket/terraform-modules/compare/v2.0.32...v2.0.33) (2021-11-18)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.157 to 0.0.165 ([#487](https://github.com/Pocket/terraform-modules/issues/487)) ([f070a94](https://github.com/Pocket/terraform-modules/commit/f070a94da839ab2f31e10bc4103eb6430ded66ca))

### [2.0.32](https://github.com/Pocket/terraform-modules/compare/v2.0.31...v2.0.32) (2021-11-17)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.150 to 0.0.157 ([#478](https://github.com/Pocket/terraform-modules/issues/478)) ([e34d30f](https://github.com/Pocket/terraform-modules/commit/e34d30f069c0ed6e375a0ab2b193527daf39f9a5))

### [2.0.31](https://github.com/Pocket/terraform-modules/compare/v2.0.30...v2.0.31) (2021-11-17)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.154 to 0.0.161 ([#481](https://github.com/Pocket/terraform-modules/issues/481)) ([5920ed7](https://github.com/Pocket/terraform-modules/commit/5920ed7aeea7174e4733cb1bcd359483140dd6e3))

### [2.0.30](https://github.com/Pocket/terraform-modules/compare/v2.0.29...v2.0.30) (2021-11-16)


### Bug Fixes

* **lambda:** Fix Lambda alias function version ([#476](https://github.com/Pocket/terraform-modules/issues/476)) ([8fe6e16](https://github.com/Pocket/terraform-modules/commit/8fe6e16913d414d525baf2e8641e465d1b730aec))

### [2.0.29](https://github.com/Pocket/terraform-modules/compare/v2.0.28...v2.0.29) (2021-11-16)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.150 to 0.2.156 ([#473](https://github.com/Pocket/terraform-modules/issues/473)) ([dcfd465](https://github.com/Pocket/terraform-modules/commit/dcfd465d48203ce4999faf7ea5c0c21939e62aae))

### [2.0.28](https://github.com/Pocket/terraform-modules/compare/v2.0.27...v2.0.28) (2021-11-16)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.142 to 0.0.150 ([#475](https://github.com/Pocket/terraform-modules/issues/475)) ([5e47564](https://github.com/Pocket/terraform-modules/commit/5e4756414f8d89ef957a5fcc23a1b22e0b22aff8))

### [2.0.27](https://github.com/Pocket/terraform-modules/compare/v2.0.26...v2.0.27) (2021-11-16)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.147 to 0.0.154 ([#474](https://github.com/Pocket/terraform-modules/issues/474)) ([0374c01](https://github.com/Pocket/terraform-modules/commit/0374c0107249490405c36aec3f32389fadbf7339))

### [2.0.26](https://github.com/Pocket/terraform-modules/compare/v2.0.25...v2.0.26) (2021-11-16)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.131 to 0.0.137 ([#467](https://github.com/Pocket/terraform-modules/issues/467)) ([ecf147a](https://github.com/Pocket/terraform-modules/commit/ecf147a025a1f9ed09615e216edade35d7e61b3f))

### [2.0.25](https://github.com/Pocket/terraform-modules/compare/v2.0.24...v2.0.25) (2021-11-15)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.130 to 0.2.150 ([#465](https://github.com/Pocket/terraform-modules/issues/465)) ([fea662f](https://github.com/Pocket/terraform-modules/commit/fea662fef62e137a9dcae7255c53ec91acc2793d))

### [2.0.24](https://github.com/Pocket/terraform-modules/compare/v2.0.23...v2.0.24) (2021-11-15)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.125 to 0.0.147 ([#466](https://github.com/Pocket/terraform-modules/issues/466)) ([1d2ee3b](https://github.com/Pocket/terraform-modules/commit/1d2ee3b5645446b17bcb989d327b55051417ef20))

### [2.0.23](https://github.com/Pocket/terraform-modules/compare/v2.0.22...v2.0.23) (2021-11-15)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.112 to 0.0.131 ([#464](https://github.com/Pocket/terraform-modules/issues/464)) ([759cd73](https://github.com/Pocket/terraform-modules/commit/759cd7339defbb93faac9e84a90a4318c2d261b0))

### [2.0.22](https://github.com/Pocket/terraform-modules/compare/v2.0.21...v2.0.22) (2021-11-15)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.122 to 0.0.142 ([#460](https://github.com/Pocket/terraform-modules/issues/460)) ([71a41e1](https://github.com/Pocket/terraform-modules/commit/71a41e14ce3866236a6c88da707c761eb8850cf9))

### [2.0.21](https://github.com/Pocket/terraform-modules/compare/v2.0.20...v2.0.21) (2021-11-12)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.123 to 0.2.130 ([#458](https://github.com/Pocket/terraform-modules/issues/458)) ([30798b0](https://github.com/Pocket/terraform-modules/commit/30798b09659d79b6e7fde3fbd24a3485623ffd8c))

### [2.0.20](https://github.com/Pocket/terraform-modules/compare/v2.0.19...v2.0.20) (2021-11-12)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.114 to 0.0.122 ([#459](https://github.com/Pocket/terraform-modules/issues/459)) ([d2d76de](https://github.com/Pocket/terraform-modules/commit/d2d76de8a886662cf9cb315fb2fce03e8f749f89))

### [2.0.19](https://github.com/Pocket/terraform-modules/compare/v2.0.18...v2.0.19) (2021-11-12)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.119 to 0.0.125 ([#457](https://github.com/Pocket/terraform-modules/issues/457)) ([645d9a8](https://github.com/Pocket/terraform-modules/commit/645d9a8aac5a0822d4e081dcdc28dafd1d02c555))

### [2.0.18](https://github.com/Pocket/terraform-modules/compare/v2.0.17...v2.0.18) (2021-11-12)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.107 to 0.0.112 ([#454](https://github.com/Pocket/terraform-modules/issues/454)) ([4671c69](https://github.com/Pocket/terraform-modules/commit/4671c6905abb29da97c53246a3dd3cd20eb34bc2))

### [2.0.17](https://github.com/Pocket/terraform-modules/compare/v2.0.16...v2.0.17) (2021-11-11)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.100 to 0.0.107 ([#452](https://github.com/Pocket/terraform-modules/issues/452)) ([2014e1c](https://github.com/Pocket/terraform-modules/commit/2014e1ca51108a444c5bea6620cf237c9abcd751))

### [2.0.16](https://github.com/Pocket/terraform-modules/compare/v2.0.15...v2.0.16) (2021-11-11)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.111 to 0.0.119 ([#453](https://github.com/Pocket/terraform-modules/issues/453)) ([a364177](https://github.com/Pocket/terraform-modules/commit/a364177d515fc8149436f3c12d36e21257f5df45))

### [2.0.15](https://github.com/Pocket/terraform-modules/compare/v2.0.14...v2.0.15) (2021-11-11)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.116 to 0.2.123 ([#451](https://github.com/Pocket/terraform-modules/issues/451)) ([6ae8d94](https://github.com/Pocket/terraform-modules/commit/6ae8d9425bc68010531233f867f883d4622d650f))

### [2.0.14](https://github.com/Pocket/terraform-modules/compare/v2.0.13...v2.0.14) (2021-11-11)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.108 to 0.0.114 ([#448](https://github.com/Pocket/terraform-modules/issues/448)) ([70d0b97](https://github.com/Pocket/terraform-modules/commit/70d0b9764f72e6492650b3e544f8721ef3ca7f3c))

### [2.0.13](https://github.com/Pocket/terraform-modules/compare/v2.0.12...v2.0.13) (2021-11-10)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.102 to 0.0.108 ([#445](https://github.com/Pocket/terraform-modules/issues/445)) ([2650939](https://github.com/Pocket/terraform-modules/commit/26509393be852aef8e05e05b54c13bd21f179024))

### [2.0.12](https://github.com/Pocket/terraform-modules/compare/v2.0.11...v2.0.12) (2021-11-10)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.109 to 0.2.116 ([#446](https://github.com/Pocket/terraform-modules/issues/446)) ([358f228](https://github.com/Pocket/terraform-modules/commit/358f2284803818f14bc182432db2513b399430d7))

### [2.0.11](https://github.com/Pocket/terraform-modules/compare/v2.0.10...v2.0.11) (2021-11-10)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.105 to 0.0.111 ([#442](https://github.com/Pocket/terraform-modules/issues/442)) ([6760fce](https://github.com/Pocket/terraform-modules/commit/6760fcedaaf71bba1787cbb6d197d5b658f0a0bd))

### [2.0.10](https://github.com/Pocket/terraform-modules/compare/v2.0.9...v2.0.10) (2021-11-10)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.94 to 0.0.100 ([#441](https://github.com/Pocket/terraform-modules/issues/441)) ([b0ab1cf](https://github.com/Pocket/terraform-modules/commit/b0ab1cf18ce64b6a979a18142ad24e3355975e75))

### [2.0.9](https://github.com/Pocket/terraform-modules/compare/v2.0.8...v2.0.9) (2021-11-09)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.98 to 0.0.105 ([#436](https://github.com/Pocket/terraform-modules/issues/436)) ([3f0d93a](https://github.com/Pocket/terraform-modules/commit/3f0d93a40db8bd7b1e67c54b0f69c8830e974791))

### [2.0.8](https://github.com/Pocket/terraform-modules/compare/v2.0.7...v2.0.8) (2021-11-09)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.93 to 0.0.94 ([#439](https://github.com/Pocket/terraform-modules/issues/439)) ([241221e](https://github.com/Pocket/terraform-modules/commit/241221e3684d9b4e0ff8c84b7196c256a7c3c2a5))

### [2.0.7](https://github.com/Pocket/terraform-modules/compare/v2.0.6...v2.0.7) (2021-11-09)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.101 to 0.2.109 ([#437](https://github.com/Pocket/terraform-modules/issues/437)) ([2a4567c](https://github.com/Pocket/terraform-modules/commit/2a4567cf3800a78ee38f46254821d779fb017d36))

### [2.0.6](https://github.com/Pocket/terraform-modules/compare/v2.0.5...v2.0.6) (2021-11-09)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.94 to 0.0.102 ([#438](https://github.com/Pocket/terraform-modules/issues/438)) ([99732e7](https://github.com/Pocket/terraform-modules/commit/99732e7f2e879f698f73d8921e1a5923593f4e6e))

### [2.0.5](https://github.com/Pocket/terraform-modules/compare/v2.0.4...v2.0.5) (2021-11-09)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.87 to 0.0.93 ([#432](https://github.com/Pocket/terraform-modules/issues/432)) ([9b0be27](https://github.com/Pocket/terraform-modules/commit/9b0be2779a504a5730c9d1a84bb6e483496d9a73))

### [2.0.4](https://github.com/Pocket/terraform-modules/compare/v2.0.3...v2.0.4) (2021-11-08)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.68 to 0.0.87 ([#428](https://github.com/Pocket/terraform-modules/issues/428)) ([a39ffee](https://github.com/Pocket/terraform-modules/commit/a39ffee6f06b30d52ba259495ad3451b22ddedda))

### [2.0.3](https://github.com/Pocket/terraform-modules/compare/v2.0.2...v2.0.3) (2021-11-08)


### Bug Fixes

* **deps:** bump @cdktf/provider-local from 0.0.78 to 0.0.98 ([#429](https://github.com/Pocket/terraform-modules/issues/429)) ([18a50aa](https://github.com/Pocket/terraform-modules/commit/18a50aaa9870019056b009a534ae4342ce98b08d))

### [2.0.2](https://github.com/Pocket/terraform-modules/compare/v2.0.1...v2.0.2) (2021-11-08)


### Bug Fixes

* **deps:** bump @cdktf/provider-pagerduty from 0.0.75 to 0.0.94 ([#424](https://github.com/Pocket/terraform-modules/issues/424)) ([23710f4](https://github.com/Pocket/terraform-modules/commit/23710f4a04086f41640ff34e0e253d3757da149a))

### [2.0.1](https://github.com/Pocket/terraform-modules/compare/v2.0.0...v2.0.1) (2021-11-08)


### Bug Fixes

* **deps:** bump @cdktf/provider-null from 0.2.83 to 0.2.101 ([#423](https://github.com/Pocket/terraform-modules/issues/423)) ([9aaafbd](https://github.com/Pocket/terraform-modules/commit/9aaafbdb0391c34a399c1e681e324280c10c5fed))

## [2.0.0](https://github.com/Pocket/terraform-modules/compare/v1.30.1...v2.0.0) (2021-11-05)


### ⚠ BREAKING CHANGES

* **cdktf:** Please note that CDK for Terraform 0.7 contains breaking changes that will require code updates for namespacing AWS provider resources
* **cdktf:** Please note that CDK for Terraform 0.7 contains breaking changes that will require code updates for namespacing AWS provider resources
* **cdktf:** Please note that CDK for Terraform 0.7 contains breaking changes that will require code updates for namespacing AWS provider resources

### Features

* **cdktf:** Bump cdktf to version 0.7 ([#420](https://github.com/Pocket/terraform-modules/issues/420)) ([0929975](https://github.com/Pocket/terraform-modules/commit/09299755945cabc54ceb8c97a968278c68846bd2))
* **cdktf:** Bump cdktf to version 0.7 ([#421](https://github.com/Pocket/terraform-modules/issues/421)) ([c02dbf1](https://github.com/Pocket/terraform-modules/commit/c02dbf1f47ef6208b7866eed57e4fd3cee8669ff)), closes [#383](https://github.com/Pocket/terraform-modules/issues/383)
* **cdktf:** Bump cdktf to version 0.7 ([#422](https://github.com/Pocket/terraform-modules/issues/422)) ([aeb6d2d](https://github.com/Pocket/terraform-modules/commit/aeb6d2d6a1a310656e4672a7ca2b17c089f1bdbb)), closes [#383](https://github.com/Pocket/terraform-modules/issues/383)


### Bug Fixes

* **deps:** bump @cdktf/provider-archive from 0.0.62 to 0.0.68 ([#413](https://github.com/Pocket/terraform-modules/issues/413)) ([ae02c44](https://github.com/Pocket/terraform-modules/commit/ae02c4414cd5dad94b5fbb0825699fe0cfa8f366))
* **deps:** bump @cdktf/provider-archive from 0.0.8 to 0.0.62 ([#412](https://github.com/Pocket/terraform-modules/issues/412)) ([500d0d3](https://github.com/Pocket/terraform-modules/commit/500d0d39d9563dd411ab4504ae3d681ed2a4a8c6))
* **deps:** bump @cdktf/provider-local from 0.0.70 to 0.0.78 ([#418](https://github.com/Pocket/terraform-modules/issues/418)) ([ec73f68](https://github.com/Pocket/terraform-modules/commit/ec73f68ae30460f5f9cee4c3428470e724d85f1d))
* **deps:** bump @cdktf/provider-local from 0.0.8 to 0.0.70 ([#407](https://github.com/Pocket/terraform-modules/issues/407)) ([c63b9d6](https://github.com/Pocket/terraform-modules/commit/c63b9d698c4c2793310c51400cc0dff0817fa2a5))
* **deps:** bump @cdktf/provider-null from 0.2.15 to 0.2.76 ([#411](https://github.com/Pocket/terraform-modules/issues/411)) ([8c281c6](https://github.com/Pocket/terraform-modules/commit/8c281c69e3c4f681a0cbd8de3e7dee42f311ba42))
* **deps:** bump @cdktf/provider-null from 0.2.76 to 0.2.83 ([#416](https://github.com/Pocket/terraform-modules/issues/416)) ([4ad30f4](https://github.com/Pocket/terraform-modules/commit/4ad30f411e1789cc168d78812a470cf6b759b402))
* **deps:** bump @cdktf/provider-pagerduty from 0.0.67 to 0.0.75 ([#419](https://github.com/Pocket/terraform-modules/issues/419)) ([9157508](https://github.com/Pocket/terraform-modules/commit/9157508a8fd20cf467f97c1e62d9884f8f667c96))
* **deps:** bump @cdktf/provider-pagerduty from 0.0.8 to 0.0.67 ([#410](https://github.com/Pocket/terraform-modules/issues/410)) ([c44f071](https://github.com/Pocket/terraform-modules/commit/c44f071d9177faeb6d59c1b75aa35a92df867aa4))
