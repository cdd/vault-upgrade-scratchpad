if Rails.env.development?
  if defined? Webpacker::DevServerProxy
    module ResolveRackConflict
      # We had to update rack to resolve a security update.  Unfortunately, our webpackerdev fell behind.
      # This resolves the issue of HTTP_X_FORWARDED_HOST needing to be just the host, not the host and port.
      # When we update webpackerdev, this should go away.  And we should remember this pain any time we
      # update anything else.

      require "webpacker/version" # OMG - they don't require it in the gem so we have to
      raise "revisit this hack" if Gem::Version.new(Rails.version) >= (Gem::Version.new("5.3"))
      raise "get rid of this hack" if Gem::Version.new(Webpacker::VERSION) > (Gem::Version.new("3.3.1"))

      def perform_request(env)
        if env["PATH_INFO"].start_with?("/#{public_output_uri_path}") && Webpacker.dev_server.running?

          # BEGIN CHANGES FROM https://github.com/rails/webpacker/blob/3-x-stable/lib/webpacker/dev_server_proxy.rb
          # env["HTTP_HOST"] = env["HTTP_X_FORWARDED_HOST"] = env["HTTP_X_FORWARDED_SERVER"] = Webpacker.dev_server.host_with_port
          host, port = Webpacker.dev_server.host_with_port.split(":")
          env["HTTP_HOST"] = env["HTTP_X_FORWARDED_HOST"] = env["HTTP_X_FORWARDED_SERVER"] = host
          env["HTTP_PORT"] = env["HTTP_X_FORWARDED_PORT"] = env["HTTP_X_FORWARDED_SERVER"] = port || "3035"
          env["HTTP_X_FORWARDED_HOST_AND_PORT"] = "#{host}:#{port}"
          # END CHANGES

          env["HTTP_X_FORWARDED_PROTO"] = env["HTTP_X_FORWARDED_SCHEME"] = Webpacker.dev_server.protocol
          unless Webpacker.dev_server.https?
            env["HTTPS"] = env["HTTP_X_FORWARDED_SSL"] = "off"
          end
          env["SCRIPT_NAME"] = ""

          super(env)
        else
          @app.call(env)
        end
      end
    end

    Webpacker::DevServerProxy.include(ResolveRackConflict) # NOT prepend - clobber existing
  end
end
