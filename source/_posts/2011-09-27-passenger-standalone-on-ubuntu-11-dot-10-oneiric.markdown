---
layout: post
title: "Passenger Standalone on Ubuntu 11.10 (Oneiric Ocelot)"
date: 2011-09-27 09:51
comments: true
categories: ubuntu, oneiric, passenger, passenger standalone, workarounds
---
Until [issue 704](http://code.google.com/p/phusion-passenger/issues/detail?id=704) is resolved, [Passenger Standalone](http://www.modrails.com/) won't compile properly on Ubuntu 11.10 (Oneirc Ocelot - currently pre-release) using the default settings.

To work around this, use GCC 4.4 instead.  You'll need to install `gcc-4.4` and `libstdc++6-4.4-dev` and then specify GCC 4.4 at compile time using the CC environment variable.

{% codeblock lang:bash %}
$ sudo apt-get install gcc-4.4 libstdc++6-4.4-dev
$ CC=gcc-4.4 passenger start
{% endcodeblock %}

Hopefully this will help anyone else who's updated to the latest Ubuntu pre-release and still wants to use Passenger Standalone.
