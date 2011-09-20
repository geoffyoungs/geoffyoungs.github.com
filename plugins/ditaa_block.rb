# Title: Ditaa for Jekyll
# Author: geoffyoungs http://geoffyoungs.github.com
# Description: Write codeblocks with semantic HTML5 <figure> and <figcaption> elements and optional syntax highlighting — all with a simple, intuitive interface.
#
# Syntax:
# {% codeblock [title] [url] [link text] %}
# code snippet
# {% endcodeblock %}
#
require 'tempfile'
require 'fileutils'
require 'digest/md5'
require 'image_size'
require 'pp'
module JekyllPlugin
  class Ditaa < Liquid::Block
    def initialize(tag_name, markup, tokens)
		super
		unless File.mtime(__FILE__)==$ditaa
			load(__FILE__)
			$ditaa = File.mtime(__FILE__)
		end
		@flags = markup.scan(/"((?:\\"|[^"])+?)"|'((?:\\'|[^'])+?)'|([-a-zA-Z0-9_]+)/).flatten.compact
    end
    def render(context)
		text = super.join("\n").strip
		page = context['page']

		md5 = Digest::MD5.hexdigest(@flags.inspect+text)
		target = File.expand_path("source/media/diagram-#{md5}.png")
		fn = File.basename(target)

		unless File.exist?(target)
			(page['diagrams'] ||= []) << text

			tmp = Tempfile.new("ditaadiagram")
			tmp.write(text)
			tmp.flush

			#fn = "diagram-#{page['diagrams'].size}.png"
			#target =  File.expand_path("source/media#{page['id']}/#{fn}")

			FileUtils.mkdir_p(File.dirname(target))

			args = ['ditaa']
			args << '-E' if @flags.include?('no-separation')
			args << '-r' if @flags.include?('round-corners')
			tmptgt = "/tmp/diagram.#{$$}.png"
			args += [tmp.path, '-o', tmptgt]
			system(*args)

			if !File.exist?(target) or (File.read(target) != File.read(tmptgt))
				FileUtils.cp(tmptgt, target)
			end
		end
		
		w, h = *File.open(target, 'rb') { |fp| ImageSize.new(fp.read) }.size
		

		title = find_attribute("title", nil)
		alt = find_attribute("alt", title)
		title ||= ''
		alt   ||= 'ASCII Art Diagram'
		

		%Q{<img alt="#{CGI.escapeHTML(alt)}" src="/media/#{fn}" width="#{w}" height="#{h}">}
    end
    def find_attribute(name, default)
		@flags.each do |flag|
			m = /^#{name}:(.*)/.match(flag) and return m[1]
		end
		default
	end
  end
end
Liquid::Template.register_tag('ditaa', JekyllPlugin::Ditaa)

