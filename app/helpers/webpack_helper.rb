module WebpackHelper
  extend self

  def webpack_component(name, props = {}, options = {})
    content = javascript_tag(<<-JS.html_safe) # rubocop:disable Rails/OutputSafety
        $(function () {
          new Globals.Component.Class.#{name.camelcase}(#{props.to_json})
        })
      JS

    content_tag(
      :div,
      content,
      options.merge(
        id: name.to_s.camelize(:lower)
      ),
    )
  end

  # Use like
  # Add your react component like CDD.Component.Class.MyComponentName (see app/frontend/index.js)
  # = react_component('my_component_name', {some: 'react props'}, {class: 'container class', other: 'html options'})
  def react_component(name, props = {}, options = {})
    class_name = name.to_s.camelize(:lower)
    class_names = [options[:class], class_name, "react_component"].compact.join(" ")
    react_options = options.merge(class: class_names, component_class: name.camelcase, react_props: props.to_json)
    content_tag(:div, react_options) do
      yield if block_given?
    end
  end
end
