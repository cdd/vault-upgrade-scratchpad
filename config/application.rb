require_relative "boot"

require "rails/all"
# require "active_model/railtie" 
# # And now the rest
# require "action_controller/railtie"
# require "action_mailer/railtie"
# require "action_view/railtie"
# require "active_job/railtie" # Only for Rails >= 4.2
# require "action_cable/engine" # Only for Rails >= 5.0
# require "sprockets/railtie"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module RailsTestBuild
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.2

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")
  end
end
