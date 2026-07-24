export default {
  // Common buttons & notifications
  btn_save: "Lưu",
  btn_cancel: "Hủy",
  btn_delete: "Xóa",
  btn_edit: "Sửa",
  btn_create: "Tạo",
  btn_close: "Đóng",
  btn_copy: "Sao chép",
  btn_copied: "Đã sao chép!",
  btn_clear: "Xóa sạch",
  btn_confirm: "Xác nhận",
  confirm_title: "Xác nhận",
  dialog_loading: "Đang xử lý...",
  toast_success: "Thành công!",
  toast_error: "Đã xảy ra lỗi!",
  toast_pin_disabled: "Đã tắt mở khóa bằng mã PIN",
  toast_pin_set_success: "Mã PIN đã được thiết lập thành công!",
  toast_timeout_updated: "Cài đặt thời gian chờ đã cập nhật",
  confirm_disable_pin:
    "Bạn có chắc chắn muốn tắt tính năng mở khóa bằng mã PIN?",

  // Detailed Error Messages
  github_error_missing_token: "Không tìm thấy token truy cập GitHub.",
  github_error_user_parse_failed:
    "Không thể xác thực thông tin người dùng GitHub.",
  github_error_gist_not_found:
    "Không tìm thấy Gist dữ liệu két mật khẩu trên GitHub.",
  github_error_create_gist_failed: "Tạo Gist mới trên GitHub thất bại.",
  github_error_gist_file_missing:
    "Không tìm thấy tệp dữ liệu trong Gist GitHub.",
  github_error_gist_parse_failed:
    "Dữ liệu Gist từ GitHub bị lỗi hoặc không đúng định dạng.",
  github_error_missing_gist_id: "Thiếu Gist ID để xử lý yêu cầu.",
  github_error_gist_size_limit:
    "Kích thước Két sắt vượt quá giới hạn của GitHub Gist (10MB). Vui lòng giảm bớt dữ liệu hoặc chia nhỏ két sắt.",
  github_error_rate_limit:
    "Đã vượt quá giới hạn lượt gọi GitHub API (Rate Limit). Vui lòng thử lại sau ít phút.",
  github_warning_gist_size_near_limit:
    "Cảnh báo: Dung lượng Két sắt ({sizeMB}MB) đang tiệm cận giới hạn 10MB của GitHub Gist.",
  sync_error_corrupted_payload:
    "Dữ liệu đồng bộ bị lỗi cấu trúc hoặc không giải mã được.",
  sync_error_invalid_format: "Định dạng dữ liệu két mật khẩu không hợp lệ.",
  sync_error_invalid_response: "Phản hồi từ tiến trình đồng bộ không hợp lệ.",
  tab_error_get_current: "Không thể lấy thông tin thẻ trình duyệt hiện tại.",
  tab_error_send_message: "Không thể gửi dữ liệu tới thẻ trình duyệt.",
  tab_error_capture: "Không thể chụp hình thẻ trình duyệt.",
  tab_error_open: "Không thể mở liên kết trong thẻ mới.",
  messaging_error_send_failed: "Lỗi kết nối tới tiến trình nền (background).",
  network_error_fetch_failed:
    "Kết nối mạng thất bại. Vui lòng kiểm tra kết nối internet.",
  network_error_http_status: "Máy chủ phản hồi với mã lỗi HTTP.",
  network_error_read_failed: "Không thể đọc dữ liệu phản hồi từ máy chủ.",
  crypto_error_encrypt_failed: "Mã hóa dữ liệu thất bại.",
  totp_error_invalid_secret: "Khóa bí mật TOTP không hợp lệ.",
  clipboard_copy_failed: "Không thể sao chép vào bộ nhớ tạm.",

  // Notification Toast Bar
  notification_save_title: "Gợi ý lưu mật khẩu",
  notification_update_title: "Gợi ý cập nhật mật khẩu",
  notification_save_prompt_prefix: "Bạn có muốn lưu mật khẩu cho ",
  notification_save_prompt_suffix: " không?",
  notification_update_prompt_prefix: "Bạn có muốn cập nhật mật khẩu cho ",
  notification_update_prompt_suffix: " không?",
  notification_btn_save: "Lưu mật khẩu",
  notification_btn_update: "Cập nhật",
  notification_autofill_title: "Gợi ý tự động điền",
  notification_autofill_prompt_prefix: "Tự động điền tài khoản ",
  notification_autofill_prompt_suffix: " ?",
  notification_btn_autofill: "Điền ngay",

  // Login Page
  login_title_locked: "Két sắt đang bị Khóa",
  login_title_setup: "Cấu hình bộ lưu trữ đám mây GitHub Gist",
  login_method_oauth: "Đăng nhập GitHub (OAuth)",
  login_method_pat: "Dùng Token (PAT)",
  login_placeholder_pat: "Nhập Personal Access Token GitHub của bạn...",
  login_pat_help:
    "Token cần có quyền truy cập <strong>gist</strong>. Tiện ích sẽ tạo một Gist bí mật (secret gist) để lưu trữ két sắt đã mã hóa của bạn.",
  login_oauth_help:
    "Kết nối tự động và an toàn với tài khoản GitHub của bạn để đồng bộ két sắt tự động qua Cloudflare Worker Proxy riêng tư của bạn.",
  login_oauth_hide: "Ẩn cấu hình OAuth",
  login_oauth_show: "Hiện cấu hình OAuth",
  login_oauth_alert_save: "Đã lưu thông số cấu hình OAuth!",
  login_loading_auth: "Đang xác thực...",
  login_loading_connect: "Đang kết nối...",
  login_loading_unlock: "Đang mở khóa...",
  login_btn_save_token: "Kết nối GitHub (PAT)",
  login_btn_oauth: "Đăng nhập bằng GitHub",
  login_oauth_config: "Cấu hình OAuth",
  login_oauth_client_id: "Client ID của GitHub App",
  login_oauth_worker_url: "URL Cloudflare Worker Proxy",
  login_btn_save_config: "Lưu cấu hình",
  login_master_password: "Mật khẩu Master",
  pwd_strength_weak: "Yếu",
  pwd_strength_fair: "Trung bình",
  pwd_strength_good: "Tốt",
  pwd_strength_strong: "Mạnh",
  login_placeholder_mp: "Nhập mật khẩu Master...",
  login_btn_unlock: "Mở khóa",
  login_forgot_password: "Quên mật khẩu Master?",
  login_reset_token: "Đổi tài khoản GitHub",
  login_error_empty_pat: "Vui lòng nhập Personal Access Token",
  login_error_invalid_token: "Token không hợp lệ hoặc lỗi kết nối",
  login_error_any: "Đã xảy ra lỗi",
  login_error_oauth_missing_config:
    "Vui lòng mở mục 'Cấu hình OAuth' để nhập Client ID và Worker URL trước khi đăng nhập.",
  login_error_oauth_no_token: "Không nhận được token từ GitHub",
  login_error_oauth_fail: "Lỗi đăng nhập OAuth",
  login_error_empty_mp: "Vui lòng nhập Mật khẩu Master",
  login_error_wrong_mp: "Mật khẩu Master không đúng",
  caps_lock_on: "Caps Lock đang bật",
  login_error_changed_mp_hint:
    "Nếu bạn vừa đổi Mật khẩu Master trên một thiết bị khác, bạn cần phải Đăng xuất và đăng nhập lại.",
  login_error_unlock_fail: "Lỗi mở khóa",
  login_forgot_password_title: "Quên mật khẩu Master",
  login_forgot_password_msg:
    "{APP_NAME} sử dụng cơ chế mã hóa đầu-cuối (Zero-Knowledge). Mật khẩu Master không bao giờ được gửi đi hay lưu trữ trên máy chủ, do đó <strong class='text-error'>KHÔNG CÓ CÁCH NÀO</strong> để khôi phục hoặc đặt lại.<br/><br/>Để bắt đầu lại, hệ thống sẽ <strong>ĐĂNG XUẤT</strong> và <strong>XÓA DỮ LIỆU CỤC BỘ</strong>.<br/><br/>Nếu bạn muốn tiếp tục sử dụng tài khoản GitHub này, hệ thống sẽ mở trang GitHub Gist chứa két sắt cũ để bạn có thể <strong>SAO LƯU</strong> dữ liệu hoặc tiến hành <strong class='text-error'>XÓA THỦ CÔNG</strong> Gist này trên GitHub trước khi đăng nhập lại.<br/><br/>Bạn có chắc chắn muốn đăng xuất và mở trang Gist cũ không?",
  app_loading: "Đang tải {APP_NAME}...",
  login_or: "Hoặc",
  login_error_password_mismatch: "Mật khẩu xác nhận không khớp",
  login_enter_master_password: "Nhập master password",
  login_confirm_master_password: "Nhập lại để xác nhận",
  login_btn_create_master_password: "Tạo master password",
  login_checking_gist: "Đang kiểm tra dữ liệu...",

  // Vault Page
  vault_search_placeholder: "Tìm kiếm tài khoản...",
  vault_filter_title: "Bộ lọc",
  vault_filter_type: "Loại",
  vault_filter_all_types: "Tất cả các loại",
  vault_empty_title: "Chưa có tài khoản nào",
  vault_empty_subtitle:
    "Két sắt của bạn trống rỗng. Thêm mới tài khoản bằng nút + bên dưới.",
  vault_btn_sync: "Đồng bộ",
  vault_btn_settings: "Cài đặt",
  vault_btn_generator: "Sinh mã",
  vault_btn_add: "Thêm mới",
  vault_popout_title: "Mở cửa sổ riêng",
  vault_lock_title: "Khóa két sắt",
  vault_suggested_items: "Đề xuất cho trang web này",
  vault_all_items: "Tất cả tài khoản",
  vault_section_cards: "Thẻ",
  vault_section_identities: "Danh tính",
  vault_search_results: "Kết quả tìm kiếm",
  vault_no_search_matches: "Không tìm thấy tài khoản nào khớp",
  vault_menu_all: "Tất cả các mục",
  vault_menu_logins: "Đăng nhập",
  vault_menu_notes: "Ghi chú bảo mật",
  vault_menu_favorites: "Yêu thích",
  vault_item_login: "Đăng nhập",
  vault_item_note: "Ghi chú",
  vault_item_card: "Thẻ",
  vault_item_identity: "Danh tính",
  vault_item_ssh_key: "SSH Key",
  vault_syncing: "Đang đồng bộ...",
  vault_sync_error: "Lỗi đồng bộ",
  vault_no_username: "Không có tên đăng nhập",
  vault_copy_notes: "Sao chép ghi chú",
  vault_copy_options: "Lựa chọn sao chép",
  vault_menu_unfavorite: "Bỏ yêu thích",
  vault_menu_more: "Tùy chọn khác",
  vault_importing: "Đang nhập dữ liệu...",
  btn_clone: "Nhân bản",
  vault_item_clone_suffix: "Bản sao",
  vault_btn_select_mode: "Chọn nhiều",
  vault_selected_count: "Đã chọn {count}",
  vault_select_all: "Chọn tất cả",
  vault_deselect_all: "Bỏ chọn tất cả",
  vault_btn_delete_selected: "Xóa đã chọn",
  vault_confirm_bulk_delete_title: "Xác nhận xóa tài khoản",
  vault_confirm_bulk_delete_msg:
    "Bạn có chắc chắn muốn xóa {count} tài khoản đã chọn không?",

  // Item Edit / Add Page
  edit_title_add_login: "Thêm tài khoản",
  edit_title_edit_login: "Chỉnh sửa tài khoản",
  edit_title_add_note: "Thêm ghi chú",
  edit_title_edit_note: "Chỉnh sửa ghi chú",
  edit_title_add_card: "Thêm thẻ",
  edit_title_edit_card: "Chỉnh sửa thẻ",
  edit_title_add_identity: "Thêm danh tính",
  edit_title_edit_identity: "Chỉnh sửa danh tính",
  edit_title_add_ssh_key: "Thêm SSH Key",
  edit_title_edit_ssh_key: "Chỉnh sửa SSH Key",
  edit_label_name: "Tên",
  edit_placeholder_name: "Ví dụ: Facebook, Google...",
  edit_label_username: "Tên đăng nhập",
  edit_placeholder_username: "Tên đăng nhập hoặc email...",
  edit_label_password: "Mật khẩu",
  edit_placeholder_password: "Mật khẩu tài khoản...",
  edit_label_totp: "Khóa xác thực (TOTP)",
  edit_placeholder_totp: "Dán khóa bí mật (Base32) hoặc otpauth://...",
  edit_label_website: "Website",
  edit_placeholder_website: "https://example.com",
  edit_label_notes: "Ghi chú",
  edit_placeholder_notes: "Nhập ghi chú tại đây...",
  edit_label_reprompt: "Yêu cầu nhập lại mật khẩu Master cho mục này",
  reprompt_modal_title: "Xác nhận mật khẩu Master",
  reprompt_modal_desc:
    "Hành động này được bảo vệ. Để tiếp tục, vui lòng nhập lại mật khẩu Master của bạn để xác minh danh tính.",
  reprompt_modal_label: "Mật khẩu Master",
  reprompt_modal_placeholder: "",
  reprompt_modal_confirm: "Ok",
  edit_section_additional_options: "Tùy chọn bổ sung",
  edit_section_item_details: "Chi tiết mục",
  edit_label_fields: "Các trường tùy chỉnh",
  edit_field_type_text: "Văn bản",
  edit_field_type_hidden: "Ẩn",
  edit_field_type_boolean: "Boolean (Đúng/Sai)",
  edit_field_type_linked: "Liên kết",
  edit_field_name_placeholder: "Tên trường",
  edit_field_val_placeholder: "Giá trị trường",
  edit_btn_add_field: "Thêm trường",
  edit_btn_add_website: "Thêm website",
  edit_btn_delete_website: "Xóa website",
  edit_label_passkeys: "Mã khóa (Passkeys)",
  edit_passkey_creation_date: "Ngày tạo: {date}",
  edit_passkey_counter: "Bộ đếm: {count}",
  edit_passkey_rp_id: "Tên miền (RP ID): {rpId}",
  edit_passkey_username: "Tên người dùng: {name}",
  edit_passkey_user_handle: "User Handle: {handle}",
  edit_passkey_discoverable: "Discoverable: {val}",
  edit_passkey_yes: "Có",
  edit_passkey_no: "Không",
  edit_error_empty_name: "Vui lòng nhập tên",
  edit_error_save_failed: "Lỗi lưu tài khoản",
  edit_confirm_delete_title: "Xóa tài khoản",
  edit_confirm_delete_msg:
    "Bạn có chắc chắn muốn xóa mục '{name}' không? Hành động này không thể hoàn tác.",
  edit_error_delete_failed: "Lỗi xóa tài khoản",
  edit_label_type: "Loại",
  edit_type_login: "Mật khẩu",
  edit_type_note: "Ghi chú an toàn",
  edit_placeholder_name_note: "Ví dụ: Mã khẩn cấp, Cấu hình...",
  edit_placeholder_name_login: "Ví dụ: Google, Facebook...",
  edit_field_modal_title_add: "Thêm trường tùy chỉnh",
  edit_field_modal_title_edit: "Chỉnh sửa trường tùy chỉnh",
  edit_field_modal_label_type: "Loại trường",
  edit_field_type_divider: "Phân cách (Divider)",
  edit_field_modal_placeholder_name: "Ví dụ: device, pin, ip...",
  edit_field_modal_placeholder_divider: "Ví dụ: CAU HINH NET, APIS...",
  edit_field_error_empty_divider: "Vui lòng nhập tên nhóm phân cách",
  edit_field_error_empty_name: "Vui lòng nhập tên trường",
  edit_qr_success: "Đã tìm thấy và điền mã QR thành công!",
  edit_qr_error_no_match:
    "Không tìm thấy mã QR nào trên màn hình. Hãy đảm bảo mã QR đang hiển thị trên trang web phía sau.",
  edit_qr_error_fail: "Lỗi chụp quét mã QR",
  edit_confirm_delete_passkey_title: "Xóa Passkey",
  edit_confirm_delete_passkey_msg:
    "Bạn có chắc chắn muốn xóa Passkey này? Việc này sẽ hủy liên kết đăng nhập bằng Passkey của tài khoản này.",
  edit_toast_updated_note: "Đã cập nhật ghi chú!",
  edit_toast_updated_login: "Đã cập nhật tài khoản!",
  edit_toast_created_note: "Đã tạo ghi chú thành công!",
  edit_toast_created_login: "Đã tạo tài khoản thành công!",
  edit_toast_created_card: "Đã tạo thẻ thành công!",
  edit_toast_updated_card: "Đã cập nhật thẻ thành công!",
  edit_toast_updated_identity: "Đã cập nhật danh tính!",
  edit_toast_created_identity: "Đã tạo danh tính thành công!",
  edit_toast_updated_ssh_key: "Đã cập nhật SSH Key!",
  edit_toast_created_ssh_key: "Đã tạo SSH Key thành công!",

  // Item Detail Page
  detail_title_login: "Chi tiết Đăng nhập",
  detail_title_note: "Chi tiết Ghi chú",
  detail_title_card: "Xem thẻ",
  detail_title_identity: "Chi tiết Danh tính",
  detail_title_ssh_key: "Xem SSH key",
  detail_totp_copied: "Đã sao chép mã OTP",
  detail_totp_error: "MÃ LỖI",
  detail_copy_username: "Sao chép tên đăng nhập",
  detail_copy_password: "Sao chép mật khẩu",
  detail_copy_totp: "Sao chép mã OTP",
  detail_copy_card_number: "Sao chép số thẻ",
  detail_copy_card_code: "Sao chép mã bảo mật (CVV)",
  detail_copied: "Đã sao chép!",
  detail_passkey_webauthn: "Mã khóa đăng nhập (Passkey)",
  detail_fields: "Các trường tùy chỉnh",
  detail_creation_date: "Ngày tạo",
  detail_revision_date: "Ngày cập nhật",
  detail_card_expired_title: "Thẻ đã hết hạn",
  detail_card_expired_desc:
    "Nếu bạn đã gia hạn thẻ, hãy cập nhật thông tin mới của thẻ",
  detail_card_cardholder: "Tên chủ thẻ",
  detail_card_number: "Số thẻ",
  detail_card_brand: "Hãng thẻ",
  detail_card_expiration: "Hạn dùng",
  detail_card_security_code: "Mã bảo mật (CVV)",
  detail_card_details_title: "Chi tiết {brand}",
  detail_identity_personal_section: "Thông tin cá nhân",
  detail_identity_identification_section: "Giấy tờ định danh",
  detail_identity_contact_section: "Thông tin liên hệ",
  detail_identity_title: "Danh xưng",
  detail_identity_first_name: "Tên",
  detail_identity_middle_name: "Tên đệm",
  detail_identity_last_name: "Họ",
  detail_identity_username: "Tên đăng nhập",
  detail_identity_company: "Công ty",
  detail_identity_ssn: "Số an sinh xã hội (SSN)",
  detail_identity_passport: "Số hộ chiếu",
  detail_identity_license: "Bằng lái xe",
  detail_identity_email: "Email",
  detail_identity_phone: "Điện thoại",
  detail_identity_address: "Địa chỉ",
  detail_identity_city: "Thành phố",
  detail_identity_state: "Bang / Tỉnh thành",
  detail_identity_postal_code: "Mã bưu điện (Zip)",
  detail_identity_country: "Quốc gia",
  detail_ssh_private_key: "Khóa riêng tư (Private key)",
  detail_ssh_public_key: "Khóa công khai (Public key)",
  detail_ssh_fingerprint: "Mã vân tay khóa (Fingerprint)",
  ssh_invalid_key:
    "Khóa riêng tư SSH không hợp lệ hoặc định dạng không hỗ trợ (yêu cầu định dạng OpenSSH không mã hóa)",
  storage_error: "Thao tác lưu trữ thất bại.",
  ssh_import_from_clipboard:
    "Dán Khóa riêng tư OpenSSH không mã hóa từ bộ nhớ tạm",
  detail_copy_ssh_private_key: "Sao chép khóa riêng tư",
  detail_copy_ssh_public_key: "Sao chép khóa công khai",
  detail_copy_ssh_fingerprint: "Sao chép vân tay khóa",
  detail_item_history: "Lịch sử mục",
  detail_section_login: "Thông tin đăng nhập",
  detail_no_value: "Không có",
  detail_section_security: "Bảo mật & OTP",
  detail_totp_label: "Mã xác thực (TOTP)",
  detail_section_autofill: "Tùy chọn tự động điền",
  detail_visit_website: "Truy cập trang web",

  // Settings Page
  settings_header: "Cài đặt",
  settings_change_mp: "Đổi mật khẩu Master",
  settings_export: "Xuất mật khẩu (JSON)",
  settings_clear_vault: "Xóa sạch két sắt",
  settings_logout: "Đăng xuất tài khoản GitHub",
  settings_label_language: "Language / Ngôn ngữ",
  settings_lang_vi: "Tiếng Việt",
  settings_lang_en: "English",
  settings_github_account: "Tài khoản GitHub",
  settings_connected_as: "Đã kết nối với {user}",
  settings_gist_id: "Gist ID",
  settings_last_sync: "Đồng bộ lần cuối",
  settings_sync_never: "Chưa bao giờ",
  settings_label_oauth: "Cơ chế đăng nhập",
  settings_version: "Phiên bản: {ver}",
  settings_theme_label: "Chủ đề",
  settings_theme_sub: "Hiện tại: {theme}",
  settings_appearance_label: "Giao diện",
  settings_appearance_sub: "Ngôn ngữ và chủ đề sáng/tối",
  settings_about_label: "Giới thiệu",
  settings_about_sub: "Thông tin phiên bản và trang chủ dự án",
  settings_rate_label: "Đánh giá ứng dụng",
  settings_rate_sub: "Ủng hộ chúng tôi trên cửa hàng ứng dụng",
  settings_sync_time_label: "Đồng bộ thời gian",
  settings_sync_time_sub: "Đồng bộ đồng hồ với máy chủ cho mã TOTP",
  settings_sync_time_loading: "Đang đồng bộ thời gian...",
  settings_sync_time_success: "Đồng bộ thời gian thành công!",
  settings_sync_time_error:
    "Đồng bộ thời gian thất bại. Vui lòng kiểm tra kết nối mạng.",
  settings_troubleshooting_label: "Xử lý sự cố",
  settings_troubleshooting_sub: "Khắc phục các lỗi về đồng bộ và thời gian",
  settings_theme_dark: "Tối",
  settings_theme_light: "Sáng",
  settings_vault_options_label: "Tùy chọn két sắt",
  settings_vault_options_sub: "Đồng bộ, nhập và xuất dữ liệu",
  settings_autofill_options_label: "Gợi ý & Tự động điền",
  settings_autofill_options_sub: "Cấu hình gợi ý điền và tự động đăng nhập",
  autofill_options_title: "Tùy chọn tự động điền",
  autofill_options_header: "Đăng nhập tự động",
  auto_submit_on_autofill_label: "Tự động đăng nhập sau khi tự điền",
  auto_submit_on_autofill_sub:
    "Tự động gửi form hoặc click nút Đăng nhập sau khi chọn tài khoản từ gợi ý",
  settings_account_security: "Bảo mật tài khoản",
  settings_account_security_sub: "Khóa bằng mã PIN và thời gian chờ phiên",
  account_security_title: "Bảo mật tài khoản",
  unlock_options_header: "Tùy chọn mở khóa",
  unlock_with_pin: "Mở khóa bằng mã PIN",
  require_master_password_on_restart:
    "Yêu cầu mật khẩu master khi khởi động lại trình duyệt",
  session_timeout_header: "Thời gian chờ phiên",
  timeout_label: "Thời gian chờ",
  timeout_action_label: "Hành động khi chờ",
  timeout_action_lock: "Khóa",
  timeout_action_logout: "Đăng xuất",
  timeout_on_restart: "Khi khởi động lại trình duyệt",
  timeout_1min: "1 phút",
  timeout_5min: "5 phút",
  timeout_15min: "15 phút",
  timeout_30min: "30 phút",
  timeout_1hr: "1 giờ",
  timeout_4hr: "4 giờ",
  timeout_never: "Không bao giờ",
  set_pin_title: "Thiết lập mã PIN",
  set_pin_desc:
    "Bạn có thể sử dụng mã PIN này để mở khóa {APP_NAME}. Mã PIN của bạn sẽ bị thiết lập lại nếu bạn đăng xuất hoàn toàn khỏi ứng dụng.",
  set_pin_label: "Mã PIN",
  set_pin_confirm_label: "Xác nhận mã PIN",
  set_pin_error_mismatch: "Mã PIN xác nhận không khớp.",
  set_pin_error_length: "Mã PIN phải có ít nhất 4 ký tự.",
  login_unlock_with_pin: "Mở khóa bằng mã PIN",
  login_unlock_with_mp: "Mở khóa bằng Mật khẩu Master",
  login_pin_placeholder: "Nhập mã PIN của bạn...",
  login_error_wrong_pin: "Mã PIN không chính xác.",
  settings_change_mp_title: "Đổi mật khẩu Master",
  settings_change_mp_sub: "Mã hóa lại két sắt bằng mật khẩu mới",
  settings_lock_sub: "Mở lại bằng Mật khẩu Master",
  settings_clear_vault_sub: "Xóa vĩnh viễn mọi dữ liệu trong két sắt",
  settings_logout_sub: "Ngắt kết nối và xóa cấu hình Gist",
  settings_open_gist_title: "Mở Gist lưu trữ trên GitHub",
  settings_change_mp_current: "Mật khẩu hiện tại",
  settings_change_mp_new: "Mật khẩu mới",
  settings_change_mp_confirm: "Xác nhận mật khẩu mới",
  settings_change_mp_btn: "Đổi mật khẩu",
  settings_error_mp_wrong_current: "Mật khẩu Master hiện tại không đúng",
  settings_error_mp_empty_new: "Mật khẩu Master mới không được để trống",
  settings_error_mp_mismatch: "Mật khẩu xác nhận không khớp",
  settings_error_mp_fail: "Lỗi đổi mật khẩu",
  settings_error_fields_required: "Vui lòng điền đầy đủ tất cả các trường",
  settings_mp_success: "Đổi mật khẩu Master thành công!",
  settings_export_title: "Xuất dữ liệu két sắt",
  settings_export_placeholder: "Nhập mật khẩu Master để xuất...",
  settings_export_btn: "Giải mã & Tải xuống",
  settings_export_success: "Đã tải xuống file sao lưu!",
  settings_clear_vault_title: "Xóa sạch két sắt",
  settings_clear_vault_msg:
    "Bạn có chắc chắn muốn xóa TOÀN BỘ tài khoản trong két sắt? Hành động này không thể hoàn tác và toàn bộ dữ liệu trên Gist sẽ bị xóa sạch.",
  settings_clear_vault_confirm_title: "Xác nhận xóa vĩnh viễn",
  settings_clear_vault_confirm_msg:
    "XÁC NHẬN LẦN CUỐI: Xóa vĩnh viễn toàn bộ dữ liệu tài khoản? Vui lòng đảm bảo bạn đã xuất dữ liệu sao lưu (backup) trước khi tiếp tục.",
  settings_clear_vault_placeholder: "Nhập mật khẩu Master để xác nhận xóa...",
  settings_clear_vault_btn: "XÓA VĨNH VIỄN",
  settings_clear_vault_success:
    "Đã xóa toàn bộ tài khoản trong két sắt thành công!",
  settings_clear_vault_fail: "Lỗi xóa két sắt",
  settings_logout_title: "Đăng xuất",
  settings_logout_msg:
    "Bạn có chắc chắn muốn ngắt kết nối tài khoản GitHub? Thao tác này sẽ xóa toàn bộ cấu hình cục bộ.",
  settings_logout_success: "Đăng xuất thành công",
  vault_sync_success: "Đồng bộ dữ liệu thành công!",
  vault_import_success:
    "Nhập thành công {count} tài khoản! Két sắt đã được đồng bộ lên Gist.",
  vault_import_error_invalid:
    "Định dạng file không hợp lệ hoặc xác thực thất bại",
  vault_import_error_fail: "Lỗi nhập file JSON",
  vault_export_error_fail: "Lỗi xuất file JSON",
  vault_options_sync_manual: "Đồng bộ thủ công",
  vault_options_import: "Nhập dữ liệu (Import)",
  vault_options_import_sub: "Nhập tài khoản từ trình duyệt hoặc file sao lưu",
  vault_options_export: "Xuất dữ liệu (Export)",
  vault_options_export_sub: "Xuất mật khẩu ra CSV hoặc tệp sao lưu JSON",
  settings_import_accounts_title: "Nhập dữ liệu",
  import_option_browser: "Nhập từ Trình duyệt (CSV)",
  import_option_browser_sub:
    "Hỗ trợ tự động nhận diện Chrome, Edge, Firefox...",
  import_option_bitwarden_csv: "Bitwarden (CSV)",
  import_option_bitwarden_csv_sub: "Nhập mật khẩu xuất từ Bitwarden dạng CSV",
  import_option_json: "{APP_NAME} / Bitwarden (JSON)",
  import_option_json_sub: "Nhập file sao lưu dạng JSON",
  import_error_browser_invalid:
    "File CSV thiếu các cột bắt buộc: url, username, password.",
  import_error_bitwarden_invalid:
    "Tiêu đề cột không khớp với định dạng Bitwarden CSV.",
  vault_import_csv_error_fail:
    "Lỗi nhập file CSV từ trình duyệt hoặc Bitwarden.",
  settings_export_accounts_title: "Xuất dữ liệu",
  export_option_browser: "Xuất ra Trình duyệt (CSV)",
  export_option_browser_sub:
    "Tệp CSV tương thích với Google Chrome, Microsoft Edge...",
  export_option_bitwarden_csv: "Bitwarden (CSV)",
  export_option_bitwarden_csv_sub: "Tệp CSV tương thích để nhập vào Bitwarden",
  export_option_json: "{APP_NAME} / Bitwarden (JSON)",
  export_option_json_sub: "Xuất tệp sao lưu JSON không mã hóa",

  // Password Generator View
  gen_title: "Bộ sinh mật khẩu",
  gen_label_length: "Độ dài",
  gen_opt_uppercase: "Chữ hoa (A-Z)",
  gen_opt_lowercase: "Chữ thường (a-z)",
  gen_opt_numbers: "Số (0-9)",
  gen_opt_symbols: "Ký tự đặc biệt (!@#...)",
  gen_opt_avoid_ambiguous: "Tránh ký tự dễ nhầm lẫn (O, 0, l, 1)",
  gen_error_charset_empty: "Hãy chọn ít nhất một loại ký tự!",
  gen_error_invalid_words_count: "Số lượng từ phải từ 3 đến 20!",
  gen_btn_generate: "Tạo mật khẩu",
  gen_btn_copy: "Sao chép",
  gen_tab_password: "Mật khẩu",
  gen_tab_passphrase: "Cụm mật khẩu",
  gen_tab_username: "Tên đăng nhập",
  gen_options_title: "Tùy chọn",
  gen_include_title: "Bao gồm",
  gen_min_numbers: "Tối thiểu chữ số",
  gen_min_specials: "Tối thiểu ký tự đặc biệt",
  gen_error_min_exceeds_length: "Số lượng tối thiểu vượt quá độ dài mật khẩu!",
  gen_tab_passphrase_placeholder:
    "Bộ sinh cụm mật khẩu đang được phát triển...",
  gen_tab_username_placeholder: "Bộ sinh tên đăng nhập đang được phát triển...",
  gen_label_num_words: "Số lượng từ",
  gen_label_word_separator: "Ký tự phân tách từ",
  gen_opt_capitalize: "Viết hoa chữ cái đầu",
  gen_opt_include_number: "Bao gồm số",
  gen_passphrase_hint:
    "Giá trị phải từ 3 đến 20. Sử dụng từ 6 từ trở lên để tạo cụm mật khẩu mạnh.",

  // FIDO2 Prompt View
  fido2_title: "Xác thực Passkey",
  fido2_rp: "Website: {rp}",
  fido2_username: "Tài khoản: {user}",
  fido2_btn_approve: "Phê duyệt",
  fido2_btn_deny: "Từ chối",
  fido2_unlock_required: "Mở khóa két sắt để dùng Passkey",
  fido2_error_no_request: "Không có yêu cầu xác thực nào đang chờ xử lý.",
  fido2_error_load_failed: "Lỗi tải yêu cầu xác thực",
  fido2_error_save_failed: "Không thể lưu Passkey vào két sắt",
  fido2_error_create_failed: "Lỗi tạo Passkey",
  fido2_error_counter_update_failed:
    "Không thể cập nhật số lần sử dụng Passkey",
  fido2_error_assert_failed: "Lỗi xác thực Passkey",
  fido2_register_title: "Đăng ký Passkey mới",
  fido2_register_subtitle_new:
    "Ứng dụng <strong>{rp}</strong> muốn lưu Passkey cho tài khoản <strong>{user}</strong>. {APP_NAME} sẽ tạo một tài khoản mới để lưu trữ Passkey này.",
  fido2_register_subtitle_choose:
    "Chọn tài khoản để lưu trữ Passkey cho <strong>{user}</strong>:",
  fido2_register_new_account: "Tạo tài khoản mới",
  fido2_register_new_account_sub: "Lưu như một tài khoản riêng biệt",
  fido2_btn_save: "Lưu Passkey",
  fido2_assert_title: "Yêu cầu đăng nhập",
  fido2_assert_subtitle:
    "Chọn một tài khoản Passkey đã lưu cho <strong>{rp}</strong> để đăng nhập:",
  fido2_assert_btn_confirm: "Xác nhận đăng nhập",
  fido2_assert_no_match:
    "Không tìm thấy Passkey nào khớp cho tên miền <strong>{rp}</strong> trong két sắt của bạn.",
  fido2_vault_locked_title: "Két sắt đang Khóa",
  fido2_vault_locked_subtitle:
    "Mở khóa {APP_NAME} bằng mật khẩu Master để tiếp tục xác thực Passkey.",
  fido2_not_logged_in_title: "Chưa Đăng Nhập",
  fido2_not_logged_in_subtitle:
    "Vui lòng mở extension và đăng nhập vào Gistwarden trước khi sử dụng Passkey.",
  fido2_register_choose_passkey_action:
    "Tài khoản này đã có Passkey. Bạn muốn làm gì?",
  fido2_register_choose_passkey_overwrite:
    "Tài khoản này đã có nhiều Passkey. Chọn Passkey để ghi đè hoặc thêm mới:",
  fido2_register_passkey_info: "Passkey #{index} (Tạo ngày: {date})",
  fido2_register_option_overwrite: "Ghi đè Passkey hiện tại",
  fido2_register_option_add: "Thêm mới Passkey",
  fido2_register_option_add_sub:
    "Lưu như một Passkey bổ sung trong tài khoản này",

  // Navigation tabs
  nav_vault: "Két sắt",
  nav_generator: "Trình tạo",
  nav_settings: "Cài đặt",

  // Guide Page
  settings_user_guide: "Hướng dẫn sử dụng",
  settings_user_guide_sub:
    "Tìm hiểu cách sử dụng, kiến trúc bảo mật và FIDO2 Passkeys",
  settings_homepage: "Trang chủ dự án",
  settings_homepage_sub: "Ghé thăm GitHub để báo lỗi và góp ý",
  guide_homepage_btn: "Trang chủ",
  guide_title: "Hướng dẫn sử dụng {APP_NAME}",
  guide_welcome: "Chào mừng bạn đến với {APP_NAME}!",
  guide_subtitle:
    "Két sắt mật khẩu cá nhân, mã hóa Zero-Knowledge đồng bộ GitHub Gist.",
  guide_close_page: "Đóng hướng dẫn",
  guide_quick_action_desc:
    "Mở nhanh trang Github Gist để quản lý các file dữ liệu két sắt của bạn.",
  guide_open_github_btn: "Mở GitHub Gist",
  guide_tab_general: "Giới thiệu chung",
  guide_tab_gist: "Đồng bộ GitHub Gist",
  guide_tab_security: "Kiến trúc bảo mật",
  guide_tab_passkey: "Sử dụng Passkeys (FIDO2)",
  guide_tab_totp: "Mã TOTP (2FA)",
  guide_tab_import_export: "Nhập xuất dữ liệu",
  guide_tab_faq: "Câu hỏi thường gặp",
  guide_tab_privacy: "Chính sách bảo mật",

  // Guide Gist Token Steps
  guide_token_title: "Cách tạo GitHub Token để đồng bộ",
  guide_token_desc:
    "Để đồng bộ đám mây, {APP_NAME} sẽ lưu két sắt đã mã hóa vào mục GitHub Gist cá nhân của bạn. Bạn cần tạo một mã Token có quyền Gist.",
  guide_token_step1_title: "Bước 1: Đặt tên và hạn dùng",
  guide_token_step1_desc:
    "Đăng nhập GitHub, bấm nút màu xanh bên dưới để mở nhanh trang tạo Token. Hãy đặt một cái tên dễ nhớ (ví dụ: '{APP_NAME}') và chọn hạn dùng là 'No expiration' (Không hết hạn) để không bị lỗi đồng bộ sau này.",
  guide_token_step1_btn: "Mở trang tạo Token trên GitHub",
  guide_token_step1_img_info: "Đặt tên Token và chọn thời gian hết hạn",
  guide_token_step2_title: "Bước 2: Tích chọn quyền Gist và read:user",
  guide_token_step2_desc:
    "Tìm và tích chọn vào ô 'gist' (để đồng bộ két sắt) và quyền 'read:user' (dưới mục 'user' - để hiển thị tên đăng nhập và ảnh đại diện của bạn). Các quyền này chỉ cho phép {APP_NAME} truy cập gist và thông tin profile công khai, hoàn toàn không xem được các repository code riêng tư khác của bạn.",
  guide_token_step2_img_info:
    "Đảm bảo đã tích chọn quyền 'gist' và 'read:user'",
  guide_token_step3_title: "Bước 3: Tạo mã Token",
  guide_token_step3_desc:
    "Cuộn xuống cuối trang rồi nhấn nút 'Generate token' màu xanh lá để tạo mã.",
  guide_token_step3_img_info: "Nhấn nút 'Generate token' ở cuối trang",
  guide_token_step4_title: "Bước 4: Copy và dán vào cài đặt",
  guide_token_step4_desc:
    "Copy mã Token vừa hiển thị (dãy ký tự bắt đầu bằng ghp_). Sau đó mở {APP_NAME}, chọn 'Dùng Token (PAT)', dán vào ô GitHub Token rồi nhấn nút Lưu.",
  guide_token_step4_img_info: "Sao chép Token và dán vào phần cài đặt",
  guide_token_important_note: "Lưu ý quan trọng:",
  guide_token_note_desc:
    " Tuyệt đối KHÔNG đưa mã Token này cho bất kỳ ai. Extension chỉ lưu Token ngay trên máy tính của bạn và gửi trực tiếp tới GitHub, không đi qua máy chủ trung gian nào khác.",

  // Guide Passkey Registration Steps
  guide_pk_reg_title: "Cách đăng ký Passkey mới",
  guide_pk_reg_desc:
    "Để bắt đầu sử dụng đăng nhập không mật khẩu, hãy làm theo hướng dẫn 3 bước dưới đây để lưu Passkey mới vào két sắt của bạn.",
  guide_pk_reg_step1_title: "Bước 1: Bấm đăng ký trên trang web",
  guide_pk_reg_step1_desc:
    "Khi bạn đang ở trang quản lý bảo mật của trang web (ví dụ: Google, GitHub, webauthn.me), hãy bấm nút đăng ký Passkey mới (hoặc 'Add a passkey').",
  guide_pk_reg_step1_img_info: "Yêu cầu đăng ký Passkey trên trang web",
  guide_pk_reg_step2_title: "Bước 2: Chọn tài khoản lưu trữ",
  guide_pk_reg_step2_desc:
    "{APP_NAME} sẽ tự động phát hiện và chặn yêu cầu của trình duyệt để hiển thị popup. Hãy chọn tài khoản khớp có sẵn trong két sắt để liên kết, hoặc chọn 'Tạo tài khoản mới' để lưu như một mục riêng biệt.",
  guide_pk_reg_step2_img_info: "Lựa chọn tài khoản hoặc chọn tạo tài khoản mới",
  guide_pk_reg_step3_title: "Bước 3: Xác nhận lưu Passkey",
  guide_pk_reg_step3_desc:
    "Sau khi chọn, bấm nút 'Lưu Passkey' để lưu khóa riêng tư đã mã hóa vào két sắt. Extension sẽ tự động đồng bộ lên GitHub Gist nếu bạn đã thiết lập đồng bộ.",
  guide_pk_reg_step3_img_info: "Xác nhận lưu Passkey thành công",

  // Guide Passkey Login Steps
  guide_pk_login_title: "Cách đăng nhập bằng Passkey",
  guide_pk_login_desc:
    "Khi đã lưu trữ Passkey, bạn không cần nhập mật khẩu hay mã 2FA để đăng nhập nữa. Quy trình đăng nhập nhanh chóng chỉ với 2 bước:",
  guide_pk_login_step1_title: "Bước 1: Chọn đăng nhập bằng Passkey",
  guide_pk_login_step1_desc:
    "Tại trang đăng nhập của trang web, chọn hình thức đăng nhập bằng Passkey (hoặc biểu tượng hình chiếc chìa khóa/face ID).",
  guide_pk_login_step1_img_info:
    "Bấm nút đăng nhập bằng Passkey trên trang web",
  guide_pk_login_step2_title: "Bước 2: Xác nhận tài khoản trên popup",
  guide_pk_login_step2_desc:
    "Popup của {APP_NAME} sẽ hiện ra danh sách các tài khoản Passkey đã lưu cho trang web này. Hãy chọn tài khoản tương ứng và bấm 'Xác nhận đăng nhập' để truy cập ngay lập tức.",
  guide_pk_login_step2_img_info:
    "Lựa chọn tài khoản Passkey tương ứng để đăng nhập",

  // Guide TOTP Steps
  guide_totp_step1_title: "Bước 1: Quét mã QR 2FA trên trang web",
  guide_totp_step1_desc:
    "Khi trang web (ví dụ: Google, GitHub, Facebook) hiển thị mã QR cấu hình bảo mật 2 lớp, mở {APP_NAME} ra và bấm vào biểu tượng chiếc máy ảnh/quét QR ở góc bên cạnh trường TOTP để quét. Nếu không quét được QR hoặc trang web chỉ cung cấp mã chữ (Secret Key), bạn có thể sao chép đoạn mã đó rồi dán thủ công vào trường TOTP và lưu lại.",
  guide_totp_step1_img_info: "Nhấn vào biểu tượng quét mã QR trên ứng dụng",
  guide_totp_step2_title: "Bước 2: Tự động lưu và hiển thị mã OTP",
  guide_totp_step2_desc:
    "Sau khi quét, khóa bí mật sẽ tự động được giải mã và lưu lại. {APP_NAME} sẽ bắt đầu sinh mã xác thực 6 chữ số và đếm ngược 30 giây. Bạn chỉ cần click chuột vào mã này để sao chép nhanh và dán vào ô xác thực của website.",
  guide_totp_step2_img_info:
    "Mã xác thực tự động tạo và có nút click sao chép tiện lợi",
  guide_totp_step3_title: "Bước 3: Sửa lỗi mã bị sai (Đồng bộ thời gian)",
  guide_totp_step3_desc:
    "Nếu mã 2FA sinh ra bị báo không chính xác trên website, có thể đồng hồ máy tính của bạn bị lệch. Bạn có thể tự sửa nhanh bằng cách vào Cài đặt -> Giới thiệu -> Xử lý sự cố -> nhấn 'Đồng bộ thời gian' để lấy lại giờ chuẩn từ máy chủ.",

  // Guide Security Tab
  guide_sec_title: "Kiến trúc Bảo mật",
  guide_sec_subtitle:
    "Để bảo vệ thông tin cá nhân của bạn, {APP_NAME} được thiết kế với cơ chế bảo mật tối ưu giúp dữ liệu luôn an toàn trước mọi nguy cơ.",
  guide_sec_card1_title: "Mã hóa Zero-Knowledge (Kiến thức bằng Không)",
  guide_sec_card1_desc:
    "Mọi mật khẩu và ghi chú của bạn đều được mã hóa ngay trên thiết bị của bạn trước khi đồng bộ. Mật khẩu Master chỉ chạy cục bộ trong trình duyệt và KHÔNG bao giờ gửi đi bất cứ đâu. Không ai (kể cả nhà phát triển hay GitHub) có thể đọc được mật khẩu của bạn.",
  guide_sec_card2_title: "Bảo vệ mật khẩu cực kỳ mạnh mẽ",
  guide_sec_card2_desc:
    "{APP_NAME} sử dụng các công nghệ mã hóa hiện đại và an toàn nhất hiện nay để bảo vệ két sắt của bạn, giúp ngăn chặn hiệu quả mọi hành vi cố gắng dò tìm hoặc bẻ khóa mật khẩu Master của bạn ngay cả khi sử dụng siêu máy tính.",
  guide_sec_card3_title: "Đồng bộ đám mây an toàn tuyệt đối",
  guide_sec_card3_desc:
    "Dữ liệu két sắt lưu trên GitHub Gist cá nhân của bạn hoàn toàn được mã hóa thành các ký tự vô nghĩa. Dữ liệu này chỉ có thể giải mã và đọc được khi chính bạn nhập đúng mật khẩu Master của mình trên ứng dụng.",

  // Guide General Tab
  guide_gen_title: "3 Bước khởi đầu nhanh",
  guide_gen_step1_title: "Thiết lập Mật khẩu Master",
  guide_gen_step1_desc:
    "Tạo mật khẩu Master cực kỳ an toàn để mã hóa toàn bộ dữ liệu két sắt của bạn cục bộ. Mật khẩu này tuyệt đối không được quên vì không thể khôi phục.",
  guide_gen_step2_title: "Kết nối đồng bộ GitHub",
  guide_gen_step2_desc:
    "Đăng nhập nhanh qua OAuth hoặc dán Personal Access Token (PAT) có quyền 'gist' để {APP_NAME} tự tạo một Gist bí mật đồng bộ két sắt mật khẩu.",
  guide_gen_step3_title: "Sử dụng an toàn",
  guide_gen_step3_desc:
    "Bắt đầu lưu trữ tài khoản, ghi chú bảo mật, tự động điền (autofill) và giả lập/lưu Passkey (FIDO2) an toàn ngay tại trình duyệt của bạn.",

  // Guide Import / Export Tab
  guide_ie_title: "Nhập xuất dữ liệu",
  guide_ie_subtitle:
    "{APP_NAME} hoàn toàn tương thích với định dạng dữ liệu xuất từ Bitwarden. Bạn có thể dễ dàng chuyển dữ liệu két sắt của mình sang {APP_NAME}.",
  guide_ie_import_title: "Cách nhập dữ liệu từ Bitwarden",
  guide_ie_import_step1_title: "Bước 1: Xuất file JSON từ Bitwarden",
  guide_ie_import_step1_desc:
    "Mở ứng dụng hoặc tiện ích Bitwarden -> Vào Cài đặt -> Xuất két sắt -> Chọn định dạng '.json (Không mã hóa)' và tải về máy tính.",
  guide_ie_import_step2_title: "Bước 2: Nạp vào {APP_NAME}",
  guide_ie_import_step2_desc:
    "Mở {APP_NAME} -> Vào mục Cài đặt -> Tùy chọn két sắt (Vault Options) -> Nhập dữ liệu (Import) -> Chọn file JSON vừa tải về ở Bước 1.",
  guide_ie_import_step3_title: "Bước 3: Lưu trữ và đồng bộ",
  guide_ie_import_step3_desc:
    "Hệ thống sẽ mã hóa toàn bộ dữ liệu này bằng Master Password của bạn và đẩy trực tiếp lên GitHub Gist. File JSON thô của Bitwarden trên máy tính nên được xóa đi ngay lập tức để bảo mật.",
  guide_ie_export_title: "Cách xuất dữ liệu sao lưu",
  guide_ie_export_desc:
    "Để có thêm bản lưu trữ offline đề phòng trường hợp mất tài khoản GitHub hoặc hỏng máy:",
  guide_ie_export_step1:
    "Vào Cài đặt của {APP_NAME} -> Tùy chọn két sắt (Vault Options) -> Chọn 'Xuất dữ liệu (Export)'.",
  guide_ie_export_step2: "Nhập mật khẩu Master để giải mã cơ sở dữ liệu.",
  guide_ie_export_step3:
    "Bấm 'Giải mã & Tải xuống' để lưu file `accounts.json` chưa mã hóa về máy. Hãy bảo vệ file này cẩn thận vì nó chứa toàn bộ mật khẩu dạng chữ rõ!",

  // Guide FAQ Tab
  guide_faq_title: "Câu hỏi thường gặp",
  guide_faq_subtitle:
    "Giải đáp một số thắc mắc phổ biến về cơ chế đồng bộ, bảo mật và mật khẩu của {APP_NAME}.",
  guide_faq_q1_title: "❓ Mật khẩu Master của tôi có an toàn không?",
  guide_faq_q1_desc:
    "Cực kỳ an toàn. {APP_NAME} áp dụng cơ chế Zero-Knowledge (Kiến thức bằng Không). Mật khẩu Master của bạn chỉ dùng để sinh khóa mã hóa cục bộ ngay tại trình duyệt, không bao giờ được lưu lại hay gửi qua Internet.",
  guide_faq_q2_title: "❓ Tôi quên mật khẩu Master thì phải làm sao?",
  guide_faq_q2_desc:
    "Không có cách nào khôi phục mật khẩu Master. Nếu quên, bạn buộc phải đặt lại extension để bắt đầu lại từ đầu. Hãy ghi nhớ hoặc ghi mật khẩu Master ra giấy cất ở nơi an toàn.",
  guide_faq_q3_title:
    "❓ Tôi có thể đồng bộ mật khẩu trên nhiều máy tính không?",
  guide_faq_q3_desc:
    "Có. Chỉ cần cài đặt {APP_NAME} lên máy tính khác, đăng nhập cùng tài khoản GitHub (hoặc cấu hình cùng mã Token) và điền ĐÚNG mật khẩu Master đã dùng ở máy cũ. Dữ liệu sẽ tự động tải về và giải mã mượt mà.",
  guide_faq_q4_title:
    "❓ Két sắt lưu trên GitHub Gist dưới dạng bí mật (Secret Gist) có thực sự riêng tư?",
  guide_faq_q4_desc:
    "Có. Secret Gist không được index bởi các công cụ tìm kiếm và không hiện công khai trên profile GitHub của bạn. Ngay cả khi có ai đó đoán được URL của Gist, họ cũng chỉ nhìn thấy một chuỗi ký tự mã hóa vô nghĩa. Không có Master Password, dữ liệu đó hoàn toàn không thể giải mã.",

  // Guide Passkey Headers & sub-tabs
  guide_pk_header_title: "Sử dụng Passkeys (FIDO2)",
  guide_pk_header_desc:
    "{APP_NAME} hỗ trợ giả lập và quản lý khóa đăng nhập không mật khẩu (Passkeys / WebAuthn) để thay thế cho mật khẩu truyền thống.",
  guide_pk_subtab_reg: "📝 Hướng dẫn Đăng ký",
  guide_pk_subtab_login: "🔑 Hướng dẫn Đăng nhập",

  // Guide TOTP Headers
  guide_totp_header_title: "Sử dụng mã xác thực hai lớp (TOTP / 2FA)",
  guide_totp_header_desc:
    "{APP_NAME} hỗ trợ lưu trữ mã bảo mật 2 lớp (TOTP) giúp bảo vệ tài khoản của bạn. Mã xác thực sẽ tự động thay đổi sau mỗi 30 giây.",

  // Welcome View
  welcome_header_title: "Chào mừng đến với {APP_NAME}",
  welcome_desc:
    "Trình quản lý mật khẩu, giả lập Passkey và mã xác thực hai lớp (TOTP/2FA) bảo mật, hoạt động hoàn toàn trên GitHub Gist cá nhân của bạn.",
  welcome_subtitle_intro:
    "Trước khi bắt đầu, hãy cùng điểm qua một số tính năng nổi bật của {APP_NAME}:",
  welcome_feat_security_title: "Mã hóa Zero-Knowledge",
  welcome_feat_security_desc:
    "Dữ liệu được mã hóa cục bộ bằng Master Password trước khi đồng bộ lên GitHub Gist cá nhân. Tuyệt đối không ai khác có thể đọc được dữ liệu của bạn.",
  welcome_feat_passkeys_title: "Đăng nhập không mật khẩu (Passkey)",
  welcome_feat_passkeys_desc:
    "Đăng ký và xác thực an toàn bằng tiêu chuẩn WebAuthn/Passkey hiện đại, loại bỏ hoàn toàn mật khẩu truyền thống.",
  welcome_feat_totp_title: "Mã xác thực hai lớp (TOTP/2FA)",
  welcome_feat_totp_desc:
    "Lưu trữ và tự động tạo mã OTP 6 số cập nhật liên tục mỗi 30 giây giúp nâng cao bảo mật tài khoản.",
  welcome_feat_backup_title: "Nhập xuất dữ liệu dễ dàng",
  welcome_feat_backup_desc:
    "Dễ dàng sao lưu két sắt hoặc di chuyển dữ liệu từ Bitwarden thông qua tính năng nhập xuất file JSON tương thích tốt.",
  welcome_security_notice_title: "⚠️ LƯU Ý BẢO MẬT QUAN TRỌNG",
  welcome_warning_bold:
    "Quên mật khẩu Master sẽ làm MẤT DỮ LIỆU VĨNH VIỄN, KHÔNG thể khôi phục.",
  welcome_warning_sub:
    "Chúng tôi không lưu trữ mật khẩu của bạn trên bất kỳ máy chủ nào và GitHub cũng chỉ thấy dữ liệu két sắt dưới dạng các ký tự mã hóa vô nghĩa. (Lưu ý: Bạn vẫn có thể đổi Mật khẩu Master trong phần Cài đặt bất cứ lúc nào nếu muốn).",
  welcome_checkbox_label:
    "Tôi đã hiểu rằng nếu quên Mật khẩu Master, tôi chấp nhận mất toàn bộ dữ liệu vĩnh viễn và không thể khôi phục.",
  welcome_btn_continue: "Bắt đầu thiết lập",
  welcome_btn_next: "Tiếp tục",
  welcome_btn_prev: "Quay lại",

  // Privacy & Policy
  guide_privacy_title: "Chính sách Quyền riêng tư & Dữ liệu",
  guide_privacy_subtitle:
    "Quyền riêng tư của bạn là ưu tiên hàng đầu của chúng tôi. Tìm hiểu cách {APP_NAME} bảo vệ và xử lý dữ liệu của bạn.",
  guide_privacy_sec1_title: "🔒 Riêng tư Tuyệt đối (Zero-Knowledge)",
  guide_privacy_sec1_desc:
    "Mọi tính toán, khởi tạo mật khẩu và quá trình mã hóa đều diễn ra hoàn toàn cục bộ trong trình duyệt của bạn. Chúng tôi tuyệt đối không thu thập, lưu trữ, theo dõi hoặc truyền tải bất kỳ mật khẩu, ghi chú, tài khoản hay cấu hình cá nhân nào của bạn về bất kỳ máy chủ nào của chúng tôi.",
  guide_privacy_sec2_title: "☁️ Đồng bộ qua Gist cá nhân bảo mật",
  guide_privacy_sec2_desc:
    "Cơ sở dữ liệu két sắt của bạn được mã hóa bằng thuật toán tiêu chuẩn quân sự AES-256-GCM trước khi đồng bộ. Dữ liệu được truyền trực tiếp đến tài khoản GitHub Gist cá nhân của chính bạn. GitHub hay bất kỳ bên thứ ba nào chỉ nhìn thấy chuỗi ký tự mã hóa vô nghĩa; nếu không có Master Password, việc giải mã dữ liệu là bất khả thi về mặt toán học.",
  guide_privacy_sec3_title: "🚫 Không theo dõi, Quảng cáo hay Analytics",
  guide_privacy_sec3_desc:
    "Chúng tôi không tích hợp bất kỳ mã theo dõi người dùng, mạng lưới quảng cáo, mã phân tích hành vi (analytics) hay cookie theo dõi trình duyệt nào. Trải nghiệm sử dụng tiện ích của bạn là hoàn toàn riêng tư 100% đối với chúng tôi.",
  guide_privacy_sec4_title: "🔌 Quyền hạn của Tiện ích mở rộng",
  guide_privacy_sec4_desc:
    "Tiện ích chỉ yêu cầu các quyền tối thiểu cần thiết để hoạt động: quyền 'storage' để lưu cấu hình tiện ích cục bộ (như ngôn ngữ hay giao diện), quyền 'webNavigation' và 'activeTab' để hỗ trợ điền thông tin đăng nhập tự động, và quyền kết nối API đến GitHub để thực hiện đồng bộ két sắt.",
};
