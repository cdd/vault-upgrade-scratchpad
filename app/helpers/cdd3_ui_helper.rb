module Cdd3UiHelper
  extend self
  # include Parties::ProjectsHelper
  # include UsersHelper

  # def item_count(number)
  #   content_tag(:span, number, class: "count")
  # end

  # def details(text, options = {})
  #   options[:class] = ["details", options[:class]].compact.join(" ")
  #   content_tag(:div, text, class: options[:class])
  # end

  def icon_tag(image, options = {})
    options[:class] = ["icon-16", options[:class]].compact.join(" ")
    options[:alt] ||= cdd_image_alt(image)
    image_tag(("cdd30/icons/#{image}"), { width: 16, height: 16 }.merge(options))
  end

  # def boolean_icon_tag(image)
  #   image_tag("cdd30/booleans/#{image}" )
  # end

  # def salts_page_info
  #   "You can view and download a #{link_to "list of all available salts", support_salts_path}.".html_safe # rubocop:disable Rails/OutputSafety
  # end

  def layout_icon_tag(image, options = {})
    image_tag(("cdd30/layout/#{image}"), options)
  end

  # def action_icon_tag(image, options = {})
  #   span_class = ["actionIcon", options.delete(:span_class)].compact.join(" ")
  #   content_tag(:span, image_tag(("cdd30/#{image}"), options), class: span_class)
  # end

  def image_tag(image, options = {})
    input_image = options.delete(:thumbnail).nil? ? packed_image_path(image) : image
    super(input_image, options)
  end

  def image_path(image, options = {})
    super(packed_image_path(image), options)
  end

  def packed_image_path(image)
    ActionController::Base.helpers.asset_pack_path("_/assets/images/#{image}")
  end

  # def action_arrow_tag(direction)
  #   action_icon_tag("layout/arrows/actionarrow-#{direction}-blue.gif", class: "icon-10", alt: "")
  # end

  # def separator_tag(_options = {})
  #   content_tag(:span, " &middot; ".html_safe, class: "separator")
  # end

  # def visually_separated_links(options = {})
  #   links = []
  #   yield(links)
  #   content = safe_join(links, separator_tag)
  #   if options[:wrapper]
  #     content_tag(options[:wrapper][:type], content, id: options[:wrapper][:id], class: options[:wrapper][:class])
  #   else
  #     content
  #   end
  # end

  # def help_button(topic, options = {})
  #   css_class = options.has_key?(:class) ? options[:class] : "floatRight"
  #   if topic
  #     link_to(
  #       safe_join([icon_tag("help.png", alt: "?", title: options[:tooltip]), options[:text]].compact, " "),
  #       "#",
  #       id: (options[:id] || "#{topic}-help-button"),
  #       class: css_class,
  #       "data-tooltip-path": help_path(topic_name: topic)
  #     )
  #   else
  #     icon_tag("help.png", alt: "?", title: options[:tooltip], class: css_class)
  #   end
  # end

  # def beta_info_link(topic, options = {})
  #   if options[:superscript]
  #     content_tag(:sup, content_tag(:em, link_to("beta", "#",options.merge(class: "beta", "data-tooltip-path": help_path(topic_name: topic)))))
  #   else
  #     link_to(
  #       content_tag(:span, "beta ".html_safe + icon_tag("information.png", alt: "click for more information", title: "Click for more information")),
  #       "#",
  #       options.merge("data-tooltip-path": help_path(topic_name: topic))
  #     )
  #   end
  # end

  # def balloon_launcher(label, html, options = {})
  #   id= options[:id] || label.tr(" ", "_")
  #   link_to(
  #     label,
  #     "#",
  #     id: "#{id}-balloon-launcher",
  #     class: options.has_key?(:class) ? options[:class] : "",
  #     "data-tooltip-path": "load:#{id}-balloon-text"
  #   ) + content_tag(
  #     :div,
  #     html,
  #     {
  #       style: "display: none",
  #       id: "#{id}-balloon-text"
  #     }
  #   )
  # end

  # def disabled_buttony(value, options = {})
  #   link_to(value, "#", options.merge(class: buttony_classes(options.merge(disabled: true))))
  # end

  # def disabled_link(value, options = {})
  #   options[:class] = [options[:class], "disabled"].compact.join(" ")
  #   link_to value, "#", options
  # end

  # # 'name' may be html text including an image tag
  # def locked_link(name, options = {})
  #   # help_button(nil, tooltip: locked_text) +
  #   disabled_link(name, options.merge(title: locked_text))
  # end

  # def possibly_locked_link_to(locked, name, options = {}, html_options = {})
  #   if locked
  #     locked_link(name, html_options)
  #   else
  #     link_to(name, options, html_options)
  #   end
  # end

  # def possibly_locked_link_to_remote(locked, name, url, html_options = {})
  #   if locked
  #     locked_link(name, html_options)
  #   else
  #     link_to(name, url, { "data-method": :get, "data-remote": true }.merge(html_options))
  #   end
  # end

  # def buttony_classes(options = {})
  #   buttony_classes = "buttony"
  #   buttony_classes += " buttony-small" if options.delete(:small)
  #   buttony_classes += " buttony-tiny" if options.delete(:tiny)
  #   buttony_classes += " buttony-green" if options.delete(:green)
  #   buttony_classes += " buttony-red" if options.delete(:red)
  #   buttony_classes += " disabled" if options.delete(:disabled)
  #   buttony_classes
  # end

  # def collapsible_block(id, title_tag, title, options = {})
  #   block_classes = ["collapsible show-panel"]
  #   block_classes << (options[:open] ? "collapsible-open" : "collapsible-closed")
  #   block_classes << "disabled" if options[:disabled]
  #   block_classes += options[:additional_outer_classes] if options[:additional_outer_classes]

  #   block_style = "display: none;" if options[:hide]

  #   title_classes = []
  #   title_classes += options[:additional_title_classes] if options[:additional_title_classes]
  #   title_link = link_to(title, "#", id: "#{id}_title", class: title_classes.join(" ")) # we want a link for style, but the onclick on the enclosing block actually has the function

  #   content = "".html_safe
  #   if options[:title_links]
  #     content += content_tag(:div, options[:title_links], class: ["floatRight", options[:title_links_class]].join(" "))
  #   end
  #   title_options = options[:title_link_path] ? { "data-title-link-path": options[:title_link_path] } : {}
  #   content += content_tag(title_tag, title_link, title_options.merge({ "data-unfiltered-context": options[:unfiltered_context], class: "collapsible-title" }))
  #   inner_classes = ["collapsible-inner"]
  #   inner_classes += options[:additional_inner_classes] if options[:additional_inner_classes]
  #   content += content_tag(:div, options[:content] || capture_haml { yield }, id: "#{id}_inner", class: inner_classes.join(" ") )

  #   content_tag(:div, content, id: id, class: block_classes.join(" "), style: block_style)
  # end

  # def tab_container(options = {})
  #   blocks = CaptureContainerTabBlocks.new(self)
  #   yield(blocks)
  #   active_tab_id = blocks.tab_ids.detect { |id| id.split("-").last == params[:active_tab] } || blocks.tab_ids.first

  #   content_tag(:div, class: "container") do
  #     content_tag(:div, class: "container-toolbar container-tabs") do
  #       content_tag(:div, class: "left") do
  #         safe_join(blocks.left_side_tabs.map do |id, label|
  #           link_to_tab(id, label, options.merge(class: (id == active_tab_id ? "active" : nil)))
  #         end)
  #       end +
  #       content_tag(:div, class: "right") do
  #         safe_join(blocks.right_side_tabs.map do |id, label|
  #           link_to_tab(id, label, options.merge(class: (id == active_tab_id ? "active" : nil)))
  #         end)
  #       end
  #     end +
  #     content_tag(:div, class: "container-content") do
  #       content_tag(:div, class: "container-content-inner") do
  #         safe_join(blocks.map do |id, content|
  #           parts = []
  #           parts << content_tag(:div, content, class: "container-tab#{id == active_tab_id ? " container-tab-active" : ""}", id: id)
  #           parts << javascript_tag("$('##{id} :focusable:first').focus();")
  #           safe_join(parts)
  #         end)
  #       end
  #     end
  #   end
  # end

  # def link_to_tab(id, label, options = {})
  #   if label.kind_of?(Array)
  #     link_text, count = *label
  #   else
  #     link_text, count = label, tab_spacer(options)
  #   end
  #   tab_link(id, tab_label(link_text) + count, options)
  # end

  # def header_tab(label, path, options = {})
  #   link_to(tab_label(label) + tab_spacer(options) , path, options)
  # end

  # private ###########################################################

  # def locked_text
  #   if (vault = @active_data_context&.vault)
  #     if (slurp = vault.slurps.locking.first)
  #       project = slurp.project
  #       project_name = visible_project_name(project, "another project")
  #       user = slurp.owner
  #       name = visible_user(user)&.full_name || "another user"
  #       return "This feature is currently unavailable because data is being imported to #{project_name} by #{name}"
  #     end
  #   end
  #   "This feature is currently unavailable because data is being imported"
  # end

  # def tab_link(id, label, options = {})
  #   link_to(label, "##{id}", "data-show-container-tab": id, class: options[:class], id: options[:id] || "#{id}Link")
  # end

  # def tab_spacer(options = {})
  #   content_tag(:span, "", class: "fake-count count #{options[:class]}")
  # end

  # def tab_label(text)
  #   content_tag(:span, text, class: "label", title: text)
  # end

  # # Copied from rails source.  Seems like it's good enough for us.
  # def cdd_image_alt(src)
  #   # ActiveSupport::Deprecation.warn("image_alt is deprecated and will be removed from Rails 6.0. You must explicitly set alt text on images.")
  #   File.basename(src, ".*".freeze).sub(/-[[:xdigit:]]{32,64}\z/, "".freeze).tr("-_".freeze, " ".freeze).capitalize
  # end

  # class CaptureContainerTabBlocks
  #   include Enumerable

  #   attr_reader :left_side_tabs, :right_side_tabs
  #   def initialize(template)
  #     @template = template
  #     @blocks = []
  #     @right_side_tabs = []
  #     @left_side_tabs = []
  #   end

  #   def left_tab(id, label, &block)
  #     capture_block(id, &block)
  #     @left_side_tabs << [id, label]
  #   end
  #   alias_method :tab, :left_tab

  #   def right_tab(id, label, &block)
  #     capture_block(id, &block)
  #     @right_side_tabs << [id, label]
  #   end

  #   def tab_ids
  #     (@left_side_tabs + @right_side_tabs).map { |id, _label| id }
  #   end

  #   def each
  #     @blocks.each { |id, content| yield(id, content) }
  #   end

  #   private

  #   def capture_block(id)
  #     @blocks << [id, @template.capture_haml { yield }]
  #   end
  # end
end
