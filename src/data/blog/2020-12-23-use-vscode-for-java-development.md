---
title: "Use vscode for java development"
description: "Setting up VS Code as a Java IDE with the Java, Spring Boot and Gradle extension packs, plus configuring launch settings and debugging."
pubDatetime: 2020-12-23T12:00:00Z
tags:
  - java
  - springboot
  - tooling
draft: false
---

I've been using Eclipse for java development for years. And I use vscode for React development. I naturally switch between them depends on what project I work on. Recently I had some trouble using Eclipse for a project. Then I was wondering, can I also use vscode for my java projects? I do like vscode, it's simple and it's fast. I also like the way it updates itself. Not like Eclipse I have to install another new version. I googled a bit and it's really simple to set it up for java project.

Here it's the screenshot of a java project in vscoe after the setup.

![overall](/assets/images/posts/P20201223/overall.png)

First you need to install JDK 11 or plus. Depends on different operating system, the way to install is different. You can install either openJDK or Oracle JDK.

Now we can start installing extensions. The first one it's the Java Extension Pack.

![java extension](/assets/images/posts/P20201223/install_java_pack.png)

Then the Spring Boot Extension Pack.

![spring boot extension](/assets/images/posts/P20201223/install_springboot_pack.png)

And the Gradle Extension Pack.

![gradle extension](/assets/images/posts/P20201223/install_gradle_pack.png)

After install above extensions, you can open an existing java project. You will have some more views in your explorer panel. Java project view you can build and clean project. You can also specify build configuration. Springboot dashboard you can run or debug the java application.

![explorer 2 extension](/assets/images/posts/P20201223/explorer_view.png)

![explorer extension](/assets/images/posts/P20201223/start_springboot.png)

vscode using configuration file for launch options and test options. You can create them under .vscode folder under project root. You can provide java argument there like shown below.

![launch](/assets/images/posts/P20201223/lanuch_config.png)

![settings](/assets/images/posts/P20201223/settings_config.png)

You can also debug the application. Set breakpoints, inspect expression values.

![debug](/assets/images/posts/P20201223/debug.png)

![debug inspect](/assets/images/posts/P20201223/debug_inspect.png)

It's pretty smooth when using vscode for java project. Been trying it the whole day. So far I like it for java projects. Will update later if find new feature.
