---
layout: post
title: "Playing With Zip - Russian Dolls"
date: 2011-09-20 20:16
comments: true
categories: zip ruby
---
The standard answer is that zip files can't contain more than one copy of a file without containing more than one copy of a file.  In other words, there's not a portable version of a *nix style hard link.

And that's kind of true.  However it is theoretically possible to create valid zip files that violate this principle in a platform independant manner.  Unfortunately this doesn't work properly with Stuffit :(

The data for a file entry must start immediately following the header, but the header can be upto ~65k and ends with fields that should be ignored if they are not understood.  So we can stuff a local file header inside the end of a parent local file header (and prefix 32 bytes of "unknown" extra field) so that it we have two valid local file headers that each end immediately before the only copy of the file data, as pictured:

{% ditaa no-separation "title:Stuffing headers inside headers like Russian Dolls" %}
+---------------------+<-----------+
|Local Header #1 cGRE |            |
+---------------------+            |
|Extra fields cGRE    |            |
|+--------------------+<----+      | 
||Local Header #2 cBLU|     |      |
++--------------------+     |      |
|Shared file data     |     |      | 
+---------------------+     |      |
...                         |      |
+---------------------+     |      |
|Central Directory    |     |      |
|+--------------------+     |      :
||File Header #1 cGRE |-----+------+
|+--------------------+     :
||File Header #2 cBLU |-----+
++--------------------+
{% endditaa %}

And then we add the entries to Central Directory as if they were normal file entries.

Tests work fine with [Info-ZIP](http://www.info-zip.org/), [7-Zip](http://www.7-zip.org) and the Windows built-in zip support.  Unfortunately Stuffit on OS X only appears to recognise the "normal" entries (ie. doesn't extract the embedded headers).

