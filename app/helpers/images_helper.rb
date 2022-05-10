# require "zlib"

module ImagesHelper
  extend self # so controllers can call e.g. ImagesHelper.image_path

  # # If you update options here, please duplicate them into
  # # app/frontend/shared/utils/moleculeImageHelper.js

  # DEFAULT_OPTIONS = { # rubocop:disable CDD/DeepFreeze
  #   width: 219,
  #   height: 219,
  #   auto_scale: 1.0
  # }.freeze

  # EXPORT_OPTIONS = { # rubocop:disable CDD/DeepFreeze
  #   width: 226,
  #   height: 161,
  #   auto_scale: 1.0,
  #   local_base_url: true,
  #   image_format: "svg".freeze
  # }.freeze

  # MOLECULE_ICON = "_/assets/images/molecule_icon.svg".freeze
  # MIXTURE_ICON = "_/assets/images/mixture_icon.svg".freeze

  # STRUCTURE_EDITOR_OPTIONS = { # rubocop:disable CDD/DeepFreeze
  #   blank_image: MOLECULE_ICON,
  # }.freeze

  # ELN_ATTACHED_STRUCTURE_OPTIONS = { # rubocop:disable CDD/DeepFreeze
  #   auto_scale: 1.0,
  #   width: 248,
  #   height: 248,
  #   image_format: "svg".freeze,
  # }.freeze

  # ELN_ATTACHED_REACTION_OPTIONS = { # rubocop:disable CDD/DeepFreeze
  #   auto_scale: 1.0,
  #   width: 864,
  #   height: 248,
  #   image_format: "svg".freeze,
  # }.freeze

  STRUCTURELESS_IMAGE_PATH_ROOT = "static/assets/images/structureless".freeze

  # # used when grabbing images to put in an Excel export and just about anywhere else
  # def molecule_image_path(molecule, options = {})
  #   structure = molecule.mrv
  #   molecule_image_path_given_structure(molecule, structure, options)
  # end

  # # used when the mrv gives an invalid structure but the display structure may not - for exporting
  # def molecule_image_path_display_structure(molecule, options = {})
  #   structure = molecule&.structure_for_display
  #   molecule_image_path_given_structure(molecule, structure, options)
  # end

  def structureless_image_path(name)
    "#{STRUCTURELESS_IMAGE_PATH_ROOT}/#{name}"
  end

  def structureless_image_path_packed(name)
    Cdd3UiHelper.packed_image_path(structureless_image_path(name))
  end

  def structureless_image_tag(name, options = {})
    options = structure_options_for(options, false)
    image_tag(structureless_image_path(name), options)
  end

  # used when grabbing images to put in an Excel export and just about anywhere else
  def structure_image_path(structure, options = {})
    byebug
    sanitized_structure = sanitize_structure(structure)
    molecule_image_path_for_sanitized_structure(sanitized_structure, options)
  end

  def structure_editor_molecule_image_path(editor_context, molecule, options = {})
    structure = molecule.mrv
    return structureless_image_path_packed(molecule&.vault&.structureless_image_name) if structure.blank?

    structure_editor_structure_image_path(editor_context, structure, options)
  end

  def structure_editor_structure_image_path(editor_context, structure, options = {})
    case editor_context
    when "search" # used when "use this structure" button is pressed in the structure editor for a search
      options = options.reverse_merge(STRUCTURE_EDITOR_OPTIONS)
    when "archive" # used when "use this structure" button is pressed in the structure editor for editing a molecule's structure
      options = options.reverse_merge(STRUCTURE_EDITOR_OPTIONS)
    when "eln"
      options = options.reverse_merge(ELN_ATTACHED_STRUCTURE_OPTIONS)
    when "rxn"
      options = options.reverse_merge(ELN_ATTACHED_REACTION_OPTIONS)
    end
    structure_image_path(structure, options)
  end

  def structure_options_for(options, has_structure = true)
    options_with_defaults = options.reverse_merge(DEFAULT_OPTIONS)
    options_with_defaults[:img_width] ||= options_with_defaults[:width]
    options_with_defaults[:img_height] ||= options_with_defaults[:height]
    height = options_with_defaults[:img_height]
    height = options_with_defaults[:img_width] if !has_structure && !options.has_key?(:height) && !options.has_key?(:img_height) # default height is 1 for nil structures, not the usual default
    css_class = options_with_defaults.delete(:class) || "thumbnail"
    css_class += " no_structure" if !has_structure

    src = {}
    src[:width] = options_with_defaults[:img_width] unless options[:no_width_specification]
    src[:height] = height unless options[:no_height_specification]
    src.merge({
      alt: (has_structure ? "structure image" : "no structure"),
      class: css_class,
      title: options_with_defaults[:title]
    })
  end

  def molecule_image_tag(molecule, options = {})
    return mixture_image_stimulated(molecule, options) if molecule.is_mixture?
    return sequence_image_stimulated(molecule, options) if molecule.is_nucleotide? || molecule.is_amino_acid?

    structure = molecule.structure_for_display
    return structureless_image_tag(molecule.vault.structureless_image_name, options) if structure.blank?

    structure_image_tag(structure, options)
  end

  # used below and when displaying structures in search results and molecule show page
  def structure_image_tag(structure, options = {})
    sanitized_structure = sanitize_structure(structure)
    options_with_defaults = options.reverse_merge(DEFAULT_OPTIONS)

    unless sanitized_structure
      return content_tag(:div, content_tag(:p, "No Structure"), class: "molecule-img__structureless", title: options_with_defaults[:title])
    end

    src = { src: molecule_image_path_for_sanitized_structure(sanitized_structure, options_with_defaults) }
    src = { data: src } if options[:load_later]

    src.merge!(structure_options_for(options, sanitized_structure.present?))

    tag :img, src
  end

  def default_structure_launcher_svg
    path = "#{Rails.root}/app/assets/images/molecule_icon.svg"
    return File.read(path).html_safe # rubocop:disable Rails/OutputSafety
  end

  def default_mixture_launcher_svg
    path = "#{Rails.root}/app/assets/images/mixture_icon.svg"
    return File.read(path).html_safe # rubocop:disable Rails/OutputSafety
  end

  # used by search_structure_editor_molecule_image_tag and archive_molecules_structure_editor_molecule_image_tag
  def structure_editor_molecule_image_tag(structure, options = {})
    blank_image = MOLECULE_ICON
    options = options.reverse_merge(blank_image: blank_image)
    tag_options = { id: "structure_query", src: structure_image_path(structure, options) }
    tag_options[:width] = options[:width] if options[:width]
    tag_options[:height] = options[:height] if options[:height]

    structure_present = structure_present?(tag_options[:src], blank_image)
    render partial: "structure_editor/launch_structure_editor", locals: { tag_options: tag_options, structure_present: structure_present }
  end

  def structure_present?(structure_image_path, default_image_path)
    !structure_image_path.match?(default_image_path.scan(/^[^\.]*/).first)
  end

  # used when editing a molecule structure
  def archive_molecules_structure_editor_molecule_image_tag(structure)
    structure_editor_molecule_image_tag(structure, STRUCTURE_EDITOR_OPTIONS)
  end

  # used when building a search - when we have no structure we invite the user to create one
  def search_structure_editor_molecule_image_tag(search)
    structure = search.structure
    options = STRUCTURE_EDITOR_OPTIONS.reject { |key, _value| %i[width height].include?(key) }
    structure_editor_molecule_image_tag(structure, options)
  end

  private ##################################################

  def molecule_image_path_given_structure(molecule, structure, options)
    sanitized_structure = sanitize_structure(structure)
    return molecule_image_path_for_sanitized_structure(sanitized_structure, options) if sanitized_structure.present?

    # No sanitized structure - fall back to the vault's chosen structureless image
    structureless_image_name = molecule.vault.structureless_image_name
    structureless_image_path(structureless_image_name)
  end

  def no_structure_image_image(options)
    blank_image(options) ? ActionController::Base.helpers.asset_pack_path(blank_image(options)) : nil
  end

  # Performance: Only sanitize the structure once when invoking molecule_image_tag
  def molecule_image_path_for_sanitized_structure(sanitized_structure, options = {})
    options = options.reverse_merge(DEFAULT_OPTIONS)
    return no_structure_image_image(options) if sanitized_structure.blank?

    parameters = {
      structure: encode_structure_string_for_url(sanitized_structure),
      width: options[:width],
      height: options[:height],
      auto_scale: options[:auto_scale],
      image_format: options[:image_format] || "svg"
    }
    if options[:substructure]
      parameters[:substructure] = encode_structure_string_for_url(options[:substructure])
    end
    if options[:auto_scale]
      parameters[:auto_scale] = options[:auto_scale]
    end
    # SECURITY: be sure to whitelist the base URL, otherwise this can be used
    # as a proxy to access local services.
    base_url = options[:local_base_url] ? CDD::JAVA_APP_CDD_SERVICES_BASE_FOR_LOCAL_SERVICES : CDD::JAVA_APP_CDD_SERVICES_BASE_FOR_BROWSERS
    return "#{base_url}/molecule_image?#{parameters.to_query}"
  end

  def encode_structure_string_for_url(structure)
    @encoded_structure_hash ||= LruRedux::Cache.new(20)
    @encoded_structure_hash.getset(structure) do
      Base64.encode64(Zlib::Deflate.deflate(structure.to_str)).delete("\n")
    end
  end

  def blank_image(options)
    raise ArgumentError.new("Invalid or empty structures don't with :local_base_url. Check Structure.empty? before calling, or change this helper.") if options[:local_base_url]

    return options[:blank_image]
  end

  # NOTE: there are corresponding settings on the Java side
  STRUCTURE_TOO_LARGE_CXSMILES = "* |$Structure too large for display_p$|".freeze # This "structure" just shows a message.
  MRV_LIMIT = 100000
  def sanitize_structure(structure)
    return nil if structure.blank? || ActiveDataContext.mask_structures?
    return STRUCTURE_TOO_LARGE_CXSMILES if structure.size > MRV_LIMIT
    return nil if Structure.empty?(structure, true)

    return structure
  end
end
