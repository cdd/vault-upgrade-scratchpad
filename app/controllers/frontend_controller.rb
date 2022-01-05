class FrontendController < ActionController::Base
  # Minimal controller used to provide a play space for react components in the dev env
  layout "application"
  helper_method :csp_nonce
  helper_method :dashboard_path
  protect_from_forgery with: :exception

  before_action :require_dev_env
  before_action :stub_session

  def index
  end

  def specs
    render layout: nil
  end

  protected

  def require_dev_env
    # Should not be needed - handled in routes.rb
    raise "You do not belong here" unless Rails.env.development?
  end

  def stub_session
    @current_user = OpenStruct.new({ full_name: :nobody })
    @session_timeout = 30000
  end

  def csp_nonce
    "csp_nonce"
  end

  def dashboard_path
    "/"
  end
end
