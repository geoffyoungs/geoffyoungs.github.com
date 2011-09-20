---
layout: post
title: "Playing With Zip"
date: 2011-09-05 18:36
comments: true
categories: zip ruby
---
I wanted to stream zip files with lots of JPEGs in.  Hundreds of JPEGs from digital cameras and, being as they were JPEGs, didn't really care about trying to compress them any further.

  1. I wanted to create (potentially) huge archives.  So I'd need something that supported ZIP64 extensions.
  2. I wanted to mix local files and files streamed from internal web servers.
  3. I wanted to create a zip file on the fly, with minimal buffering, to minimize disk and memory requirements.
  4. I wanted to support large numbers of simultaneous downloads.
  5. I also wanted (if possible) to efficiently include the same file more than once in an archive with different filenames.
  6. I wanted to continue to use zip archives.

Simples?  

If only.

### Streaming ZIP64 support (or lack thereof)

There are several ruby zip libraries, e.g. [rubyzip](http://rubyzip.sourceforge.net/), [zip-ruby](https://bitbucket.org/winebarrel/zip-ruby/wiki/Home) and [archive-zip](https://github.com/javanthropus/archive-zip) - but they seem to fall into two camps: pure ruby with no ZIP64 or wrapping a C library (e.g. libzip) but with no obvious way to create a zip file and start streaming it before it's complete.

So I indulged my NIH syndrome reflex and wrote [zip64writer](https://github.com/geoffyoungs/zip64writer) which streams zip files and can automatically starts using ZIP64 extensions when needed. (I did look at adding ZIP64 support to rubyzip, but I figured fairly quickly that it would be easier to roll a specifically targetted library than adapt it to my needs.)

So writing a zip file to a stream works something like:

{% codeblock lang:ruby %}
require 'zip64/writer'

File.open("output.zip", "wb") do |fp|
	Zip64::ZipWriter.new(fp) do |zip|
		File.open("sample.jpg", "rb") do |rfp|
			zip.add_entry(rfp, 
					:mtime => Time.now, 
					:name => 'myphoto.jpg')
		end
	end # Implicit close writes central directory to stream
end
{% endcodeblock %}

ZIP64 extensions are extra header fields, and an extra couple of blocks at the end of the zip file, which allow zip files to contain more than 65,535 entries (the limit of a 16bit integer) & for the zip archives (and the files inside them) to be greater than 4 Gb (the limit of a 32bit integer) in size.

{% ditaa no-separation %}
|...                  |
+---------------------+               
|Local Header #1 cGRE |             
++--------------------+             
|File data            |<-=-------- 4Gb barrier
+---------------------+              
|Local Header #2 cBLU |             
+---------------------+             
|Extra fields cBLU    |             
|+--------------------+              
||ZIP64 Record        |             
++--------------------+             
|File data            |              
+---------------------+             
...
{% endditaa %}


The writer detects when an offset requires a 64bit integer (ie. offset >4Gb) and automatically starts using ZIP64 extensions - so the files are still as compatible as possible with old zip implementations that don't support ZIP64 (e.g. Windows XP shell).


Basic testing reveals that ZIP64 files created this way (ie. a mix of standard encoding and ZIP64 encoding) work fine on Windows 7, OS X 10.5+.  (Also the version of file-roller shipped with Lucid Lynx opens them fine, although the version of zip shipped with Hardy Heron is too old.)

