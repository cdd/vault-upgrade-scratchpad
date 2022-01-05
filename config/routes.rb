Rails.application.routes.draw do
  root 'home#index'
  get "utility", to: "frontend#utility"
  get 'frontend/specs', to: 'frontend#specs'

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
end
