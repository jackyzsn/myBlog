---
title: "Session filter check user session"
description: "Implement a Spring Boot servlet filter backed by Redis session storage that redirects unauthenticated users to the login page."
pubDatetime: 2020-12-04T12:00:00Z
tags:
  - java
  - springboot
  - backend
draft: false
---

If your web site requires login, you want to check user if it's login. If not, you want to redirect the user to the login page. Usually you will create user session once the user is logged in. So checking user if it's logged in, is just simply checking the session if it's exists. Normally this refer to stateful. Because before login and after login, the state changed.

So this is applied to every request. Apparently you don't want to check it individually because it will be everywhere. You can do this in filter. You can register a session filter. This filter will check if the session can be found. If found, then the filter continues on processing the chain. If not, the chain will stop, and redirect the response to login page.

Below it's a demo SpringBoot application.

SpringBoot configuration file. It configures to use redis for session storage. Also has properties for URL exclusion for session checking. Those URL will be bypassed for checking.

```yaml
spring:
   session:
      store-type:   redis
      redis:
         namespace: springback:session
   redis:
      host:   127.0.0.1 
      port:   6379

server:
   servlet:
      session:
         timeout: 30m

session-check-exclusion: /doLogin, /login 
```

Define controller class. The controller has four endpoints. /login, /logout, /doLogin and /home. /doLogin is mimicking the login page. /login is the page sending login information to backend to do the actual login. /home is the page to be shown if user is logged in. So when user request /home page, it should detect if it's logged in. If yes, show home page content. If not, show /doLogin page to ask user to login.

```java
package com.jszsoft.myweb.restback.web;

import javax.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class RestController {
	@GetMapping(path = "/login", produces = "application/json; charset=UTF-8")
	@ResponseBody
	public String login(HttpServletRequest request) {

		request.getSession().setAttribute("loggedIn", "Yes");

		return "You are logged in now..";
	}

	@GetMapping(path = "/logout", produces = "application/json; charset=UTF-8")
	@ResponseBody
	public String logout(HttpServletRequest request) {

		request.getSession().invalidate();

		return "You are logged out..";
	}

	@GetMapping(path = "/home", produces = "application/json; charset=UTF-8")
	@ResponseBody
	public String home(HttpServletRequest request) {

		return "Home Page..";

	}

	@GetMapping(path = "/doLogin", produces = "application/json; charset=UTF-8")
	@ResponseBody
	public String reqLogin(HttpServletRequest request) {

		return "Please login..";
	}

}
```

Create session filter class for checking the session.

```java
package com.jszsoft.myweb.restback.filter;
import java.io.IOException;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class SessionFilter implements Filter {

	@Value("${session-check-exclusion}")
	private String[] excludeURL;

	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
			throws IOException, ServletException {
		HttpServletRequest req = (HttpServletRequest) request;

		HttpSession session = req.getSession(false);

		String path = req.getRequestURI();

		boolean found = false;

		for (int i = 0; i < excludeURL.length; i++) {
			if (excludeURL[i].equals(path)) {
				found = true;
				break;
			}
		}

		if (found) {
			chain.doFilter(request, response); // Just continue chain.
		} else {
			if (hasValidSession(session)) {
				chain.doFilter(request, response);
			} else {
				// redirect
				((HttpServletResponse) response).sendRedirect("/doLogin");
			}
		}

	}

	private boolean hasValidSession(HttpSession session) {
		if (session == null) {
			return false;
		}

		String loggedIn = (String) session.getAttribute("loggedIn");

		return (loggedIn != null && loggedIn.equals("Yes"));
	}

}
```

Register the session filter bean.

```java
package com.jszsoft.myweb.restback;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import com.jszsoft.myweb.restback.filter.SessionFilter;

@SpringBootApplication
public class RestbackApplication {

	@Bean
	public FilterRegistrationBean<SessionFilter> loggingFilter() {
		FilterRegistrationBean<SessionFilter> registrationBean = new FilterRegistrationBean<>();

		registrationBean.setFilter(new SessionFilter());
		registrationBean.addUrlPatterns("/*");

		return registrationBean;
	}

	public static void main(String[] args) {
		SpringApplication.run(RestbackApplication.class, args);
	}

}
```

Screenshots: When request /home without login, it redirects to /doLogin page

![do login](/assets/images/posts/P20201204/dologin.png)

Screenshots: login page

![login](/assets/images/posts/P20201204/login.png)

Screenshots: When request /home after login, it shows home page

![home](/assets/images/posts/P20201204/home.png)

Screenshots: logout page

![logout](/assets/images/posts/P20201204/logout.png)

You can find the project in [jackyzsn/sessionfilterdemo](https://github.com/jackyzsn/sessionfilterdemo).
