import { APP_NAME } from "../constants.ts";

export default {
  APP_NAME,
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
  badge_status_locked: "{APP_NAME} (Đã khóa)",
  badge_status_unlocked: "{APP_NAME} (Đã mở khóa)",

  // Fallback Item Names
  fallback_name_default: "Chưa đặt tên",
  fallback_name_login: "Chưa đặt tên login",
  fallback_name_note: "Chưa đặt tên note",
  fallback_name_card: "Chưa đặt tên card",
  fallback_name_identity: "Chưa đặt tên danh tính",
  fallback_name_ssh_key: "Chưa đặt tên SSH Key",

  // Detailed Error Messages
  provider_error_missing_token: "Thiếu Access Token xác thực với máy chủ.",
  provider_error_unauthorized:
    "Access Token hết hạn hoặc không có quyền truy cập.",
  provider_error_not_found: "Không tìm thấy dữ liệu Két trên máy chủ.",
  provider_error_network: "Lỗi kết nối mạng tới máy chủ lưu trữ.",
  provider_error_user_parse_failed: "Không thể xác thực thông tin người dùng.",
  provider_error_create_failed: "Tạo Két mới trên máy chủ lưu trữ thất bại.",
  provider_error_file_missing: "Tệp dữ liệu Két không tồn tại trên máy chủ.",
  provider_error_parse_failed:
    "Dữ liệu Két từ máy chủ bị lỗi hoặc không đúng định dạng.",
  provider_error_missing_id: "Thiếu ID dữ liệu để xử lý yêu cầu.",
  vault_error_not_found: "Không tìm thấy dữ liệu két sắt.",
  sync_error_corrupted_payload:
    "Dữ liệu đồng bộ bị lỗi cấu trúc hoặc không giải mã được.",
  sync_error_remote_password_changed:
    "{login_master_password} đã bị thay đổi từ thiết bị khác. Vui lòng đăng nhập lại.",
  sync_error_invalid_format: "Định dạng dữ liệu két mật khẩu không hợp lệ.",

  // Trash View
  trash_title: "Thùng rác",
  trash_empty: "Thùng rác trống",
  trash_restore: "Khôi phục",
  trash_purge: "Xóa vĩnh viễn",
  trash_purge_all: "Dọn sạch thùng rác",
  trash_confirm_purge_all: "Xóa toàn bộ thùng rác",
  trash_confirm_purge_all_msg:
    "Bạn có chắc chắn muốn xóa vĩnh viễn tất cả các mục trong thùng rác không? Hành động này không thể hoàn tác.",
  trash_deleted_date: "Đã xóa",
  vault_options_trash_sub: "Xem và khôi phục các mục đã xóa",

  tab_error_get_current: "Không thể lấy thông tin thẻ trình duyệt hiện tại.",
  tab_error_send_message: "Không thể gửi dữ liệu tới thẻ trình duyệt.",
  tab_error_capture: "Không thể chụp hình thẻ trình duyệt.",
  tab_error_open: "Không thể mở liên kết trong thẻ mới.",
  messaging_error_send_failed: "Lỗi kết nối tới tiến trình nền (background).",
  network_error_fetch_failed:
    "Kết nối mạng thất bại. Vui lòng kiểm tra kết nối internet.",
  network_error_http_status: "Máy chủ phản hồi với mã lỗi HTTP.",
  network_error_read_failed: "Không thể đọc dữ liệu phản hồi từ máy chủ.",
  network_error_unauthorized:
    "Token truy cập đã hết hạn hoặc bị thu hồi (Lỗi 401). Hệ thống đang tự động đăng xuất...",
  network_error_payload_too_large:
    "Kích thước Két sắt vượt quá giới hạn cho phép (Lỗi 413). Vui lòng giảm bớt dữ liệu.",
  network_error_rate_limit:
    "Đã vượt quá giới hạn lượt gọi máy chủ (Lỗi 429). Vui lòng thử lại sau ít phút.",
  crypto_error_encrypt_failed: "Mã hóa dữ liệu thất bại.",
  totp_error_invalid_secret: "Khóa bí mật TOTP không hợp lệ.",
  clipboard_copy_failed: "Không thể sao chép vào bộ nhớ tạm.",
  clipboard_access_denied: "Quyền truy cập khay nhớ tạm bị từ chối.",
  clipboard_read_failed: "Không thể đọc nội dung từ khay nhớ tạm.",

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
  login_pat_label: "Mã truy cập cá nhân GitHub (PAT)",
  login_pat_help:
    "Token cần có quyền truy cập <strong>gist</strong>. Tiện ích sẽ tạo một Gist bí mật (secret gist) để lưu trữ két sắt đã mã hóa của bạn.",
  login_oauth_help:
    "Kết nối tự động và an toàn với tài khoản GitHub của bạn để đồng bộ két sắt tự động qua máy chủ Cloudflare Worker Proxy.",
  login_btn_save_token: "Kết nối GitHub (PAT)",
  login_btn_oauth: "Đăng nhập bằng GitHub",
  login_master_password: "Mật khẩu chính",
  pwd_strength_very_weak: "Rất yếu",
  pwd_strength_weak: "Yếu",
  pwd_strength_fair: "Trung bình",
  pwd_strength_strong: "Mạnh",
  pwd_strength_very_strong: "Rất mạnh",
  login_placeholder_mp: "Nhập {login_master_password}...",
  login_btn_unlock: "Mở khóa",
  login_forgot_password: "Quên {login_master_password}?",
  login_error_empty_pat: "Chưa nhập GitHub Token.",
  login_error_empty_username: "Vui lòng nhập tên đăng nhập.",
  login_error_empty_password: "Vui lòng nhập mật khẩu tài khoản.",
  login_error_invalid_token: "Token không hợp lệ hoặc lỗi kết nối",
  login_error_oauth_no_token: "Không nhận được token từ GitHub",
  login_error_oauth_fail: "Lỗi đăng nhập OAuth",
  login_error_empty_mp: "Vui lòng nhập {login_master_password}",
  login_error_wrong_mp: "{login_master_password} không đúng",
  caps_lock_on: "Caps Lock đang bật",
  login_error_changed_mp_hint:
    "Nếu bạn vừa đổi {login_master_password} trên một thiết bị khác, bạn cần phải Đăng xuất và đăng nhập lại.",
  login_error_mp_cooldown:
    "Nhập sai {login_master_password} nhiều lần. Vui lòng thử lại sau.",
  login_error_mp_tampered:
    "Dữ liệu bảo vệ {login_master_password} bị thay đổi trái phép. Hệ thống đã đăng xuất để bảo vệ tài khoản.",
  login_forgot_password_title: "Quên {login_master_password}",
  login_forgot_password_msg:
    "{APP_NAME} sử dụng cơ chế mã hóa đầu-cuối (Zero-Knowledge). {login_master_password} không bao giờ được gửi đi hay lưu trữ trên máy chủ, do đó <strong class='text-error'>KHÔNG CÓ CÁCH NÀO</strong> để khôi phục hoặc đặt lại.<br/><br/>Để bắt đầu lại, hệ thống sẽ <strong>ĐĂNG XUẤT</strong> và <strong>XÓA DỮ LIỆU CỤC BỘ</strong>.<br/><br/>Nếu bạn muốn tiếp tục sử dụng tài khoản GitHub này, hệ thống sẽ mở trang GitHub Gist chứa két sắt cũ để bạn có thể <strong>SAO LƯU</strong> dữ liệu hoặc tiến hành <strong class='text-error'>XÓA THỦ CÔNG</strong> Gist này trên GitHub trước khi đăng nhập lại.<br/><br/>Bạn có chắc chắn muốn đăng xuất và mở trang Gist cũ không?",
  login_local_forgot_password_title: "Quên {login_master_password} Local Vault",
  login_local_forgot_password_msg:
    "Local Vault được mã hóa 100% cục bộ trên thiết bị của bạn và không lưu trữ chìa khóa khôi phục dự phòng. Nếu quên {login_master_password}, dữ liệu Két sắt hiện tại sẽ <strong class='text-error'>KHÔNG THỂ</strong> giải mã hay khôi phục.<br/><br/>Để xác nhận xóa toàn bộ dữ liệu bị khóa và đặt lại Két sắt, vui lòng nhập chính xác chữ <strong class='text-error'>RESET</strong> vào ô bên dưới:",
  login_local_reset_btn: "Xóa & Đặt lại Két sắt",
  login_local_reset_placeholder: "Nhập RESET để xác nhận...",
  app_loading: "Đang tải {APP_NAME}...",
  login_or: "Hoặc",
  login_error_password_mismatch: "Mật khẩu xác nhận không khớp",
  login_enter_master_password: "Nhập {login_master_password}",
  login_confirm_master_password: "Nhập lại để xác nhận",
  login_btn_create_master_password: "Tạo {login_master_password}",
  login_checking_gist: "Đang kiểm tra dữ liệu...",
  login_local_vault_must_read: "Cảnh báo & lưu ý quan trọng",
  login_local_vault_must_read_btn: "Cần đọc trước",
  login_btn_access_local: "Truy cập Kho Cục Bộ",
  login_self_hosted_must_read: "Cảnh báo & hướng dẫn tự host",
  login_self_hosted_must_read_btn: "Cần đọc trước",

  // Vault Page
  vault_search_placeholder: "Tìm kiếm tài khoản...",
  vault_filter_title: "Bộ lọc",
  vault_filter_type: "Loại",
  vault_filter_all_types: "Tất cả các loại",
  items_with_no_folder: "Tài khoản không có thư mục",
  vault_item_folder: "Thư mục",
  folder_new_title: "Thêm thư mục",
  folder_edit_title: "Sửa thư mục",
  folder_name_label: "Tên thư mục",
  folder_name_placeholder: "Nhập tên thư mục...",
  folder_select_label: "Thư mục",
  folder_no_folder_option: "Không thuộc thư mục nào",
  folder_error_empty_name: "Vui lòng nhập tên thư mục",
  folder_error_duplicate_name: "Thư mục với tên này đã tồn tại",
  folder_add_success: "Tạo thư mục mới thành công",
  folder_rename_success: "Đổi tên thư mục thành công",
  folder_delete_success: "Xóa thư mục thành công",
  folder_confirm_delete_title: "Xóa thư mục",
  folder_confirm_delete_msg:
    "Bạn có chắc chắn muốn xóa thư mục này? Các phần tử trong thư mục sẽ không bị xóa.",
  folder_management_title: "Quản lý thư mục",
  vault_options_folders_sub: "Tạo, chỉnh sửa và quản lý các thư mục",
  vault_empty_subtitle:
    "Két sắt của bạn chưa có dữ liệu. Hãy thêm mới tài khoản bằng nút + bên dưới.",
  vault_btn_sync: "Đồng bộ",
  vault_btn_add: "Thêm mới",
  vault_popout_title: "Mở cửa sổ riêng",
  vault_lock_title: "Khóa két sắt",
  vault_suggested_items: "Đề xuất cho trang web này",
  vault_all_items: "Tất cả tài khoản",
  vault_section_cards: "Thẻ",
  vault_section_identities: "Danh tính",
  vault_search_results: "Kết quả tìm kiếm",
  vault_no_search_matches: "Không tìm thấy tài khoản nào khớp",
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
  vault_menu_select: "Chọn",
  vault_importing: "Đang nhập dữ liệu...",
  btn_clone: "Nhân bản",
  vault_item_clone_suffix: "Bản sao",
  vault_btn_select_mode: "Chọn nhiều",
  vault_selected_count: "Đã chọn {count}",
  vault_select_all: "Chọn tất cả",
  vault_deselect_all: "Bỏ chọn tất cả",
  vault_btn_delete_selected: "Xóa đã chọn",
  vault_btn_move_to_folder: "Chuyển vào thư mục",
  vault_move_to_folder_modal_title: "Di chuyển vào thư mục",
  vault_move_to_folder_success: "Đã di chuyển {count} mục vào thư mục",
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
  edit_gen_btn_title: "Tạo mật khẩu ngẫu nhiên",
  edit_gen_random_password: "Mật khẩu ngẫu nhiên",
  edit_gen_passphrase: "Cụm mật khẩu",
  edit_label_totp: "Khóa xác thực (TOTP)",
  edit_placeholder_totp: "Dán khóa bí mật (Base32) hoặc otpauth://...",
  edit_label_website: "Website",
  edit_label_notes: "Ghi chú",
  edit_placeholder_notes: "Nhập ghi chú tại đây...",
  edit_label_reprompt: "Yêu cầu nhập lại {login_master_password} cho mục này",
  reprompt_modal_title: "Xác nhận {login_master_password}",
  reprompt_modal_desc:
    "Hành động này được bảo vệ. Để tiếp tục, vui lòng nhập lại {login_master_password} của bạn để xác minh danh tính.",
  reprompt_modal_label: "Mật khẩu chính",
  reprompt_modal_placeholder: "",
  reprompt_modal_confirm: "Ok",
  edit_section_additional_options: "Tùy chọn bổ sung",
  edit_section_item_details: "Chi tiết mục",
  edit_label_fields: "Các trường tùy chỉnh",
  edit_field_type_text: "Văn bản",
  edit_field_type_hidden: "Ẩn (Hidden)",
  edit_field_type_boolean: "Hộp kiểm (Checkbox)",
  edit_field_type_linked: "Liên kết",
  edit_field_name_placeholder: "Tên trường",
  edit_field_val_placeholder: "Giá trị trường",
  edit_btn_add_field: "Thêm trường",
  edit_btn_add_website: "Thêm website",
  edit_btn_delete_website: "Xóa website",
  edit_error_empty_name: "Vui lòng nhập tên",
  edit_confirm_delete_title: "Xóa tài khoản",
  edit_confirm_delete_msg:
    "Bạn có chắc chắn muốn xóa mục '{name}' không? Hành động này không thể hoàn tác.",
  edit_type_note: "Ghi chú bảo mật",
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
  settings_change_mp: "Đổi {login_master_password}",
  settings_export: "Xuất mật khẩu (JSON)",
  settings_clear_vault: "Xóa sạch két sắt",
  settings_logout: "Đăng xuất tài khoản GitHub",
  settings_label_language: "Language / Ngôn ngữ",
  settings_lang_vi: "Tiếng Việt",
  settings_lang_en: "English",
  settings_last_sync: "Đồng bộ lần cuối",
  settings_sync_never: "Chưa bao giờ",
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
  settings_vault_options_label: "Quản lý dữ liệu",
  settings_vault_options_sub: "Đồng bộ, nhập và xuất dữ liệu",
  settings_enable_animations_label: "Hiệu ứng chuyển trang",
  settings_enable_animations_sub:
    "Bật hiệu ứng trượt mượt mà khi chuyển giữa các trang",
  settings_autofill_options_label: "Gợi ý & Tự động điền",
  settings_autofill_options_sub: "Cấu hình gợi ý điền và tự động đăng nhập",
  autofill_options_title: "Tùy chọn tự động điền",
  autofill_options_header: "Gợi ý & Tự động đăng nhập",
  show_autofill_suggestions_label: "Hiển thị gợi ý điền khi chọn ô nhập liệu",
  show_autofill_suggestions_sub:
    "Tự động bật ô gợi ý tài khoản khi bạn click/focus vào các ô nhập thông tin đăng nhập",
  auto_submit_on_autofill_label: "Tự động đăng nhập sau khi tự điền",
  auto_submit_on_autofill_sub:
    "Tự động gửi form hoặc click nút Đăng nhập sau khi chọn tài khoản từ gợi ý",
  auto_copy_totp_label: "Tự động sao chép mã TOTP vào bộ nhớ tạm",
  auto_copy_totp_sub:
    "Tự động sao chép mã OTP 6 số vào bộ nhớ tạm khi điền tự động tài khoản có 2FA",
  toast_totp_copied: "Đã sao chép mã TOTP vào bộ nhớ tạm",
  autofill_excluded_domains_title: "Danh sách tên miền ngoại lệ",
  autofill_excluded_domains_sub:
    "Không gửi thông báo lưu mật khẩu hoặc hiển thị gợi ý tự động điền trên các trang web này",
  autofill_excluded_domain_placeholder: "Ví dụ: domain.com",
  autofill_btn_add_domain: "Thêm",
  autofill_excluded_domain_default_tag: "Mặc định",
  settings_account_security: "Bảo mật tài khoản",
  settings_account_security_sub: "Khóa bằng mã PIN và thời gian chờ phiên",
  account_security_title: "Bảo mật tài khoản",
  unlock_options_header: "Tùy chọn mở khóa",
  unlock_with_pin: "Mở khóa bằng mã PIN",
  require_master_password_on_restart:
    "Yêu cầu mật khẩu chính khi khởi động lại trình duyệt",
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
  set_pin_title: "Thiết lập mã PIN",
  set_pin_desc:
    "Bạn có thể sử dụng mã PIN này để mở khóa {APP_NAME}. Mã PIN của bạn sẽ bị thiết lập lại nếu bạn đăng xuất hoàn toàn khỏi ứng dụng.",
  set_pin_label: "Mã PIN",
  set_pin_error_length: "Mã PIN phải có ít nhất 4 ký tự.",
  login_unlock_with_pin: "Mở khóa bằng mã PIN",
  login_unlock_with_mp: "Mở khóa bằng {login_master_password}",
  login_pin_placeholder: "Nhập mã PIN của bạn...",
  login_error_wrong_pin: "Mã PIN không chính xác.",
  login_error_wrong_pin_2_left: "Mã PIN không chính xác. Bạn còn 2 lần thử.",
  login_error_wrong_pin_1_left:
    "Mã PIN không chính xác. Bạn còn 1 lần thử cuối!",
  login_error_pin_max_attempts_reached:
    "Đã nhập sai Mã PIN 3 lần. Tính năng mở khóa PIN đã bị tắt, vui lòng sử dụng {login_master_password}.",
  login_error_pin_tampered:
    "Dữ liệu Mã PIN không hợp lệ. Tính năng mở khóa PIN đã bị tắt, vui lòng sử dụng {login_master_password}.",
  settings_change_mp_title: "Đổi {login_master_password}",
  vault_options_group_sync_import: "Đồng bộ & Nhập xuất dữ liệu",
  vault_options_group_management: "Quản lý dữ liệu",
  vault_options_group_danger: "Thao tác nguy hiểm",
  settings_change_mp_sub: "Mã hóa lại két sắt bằng mật khẩu mới",
  settings_clear_vault_sub: "Xóa vĩnh viễn mọi dữ liệu trong két sắt",
  settings_open_gist_title: "Mở Gist lưu trữ trên GitHub",
  settings_change_mp_current: "Mật khẩu hiện tại",
  settings_change_mp_new: "Mật khẩu mới",
  settings_change_mp_confirm: "Xác nhận mật khẩu mới",
  settings_error_mp_wrong_current:
    "{login_master_password} hiện tại không đúng",
  settings_error_mp_empty_new:
    "{login_master_password} mới không được để trống",
  settings_error_mp_mismatch: "Mật khẩu xác nhận không khớp",
  settings_error_mp_fail: "Lỗi đổi mật khẩu",
  settings_error_fields_required: "Vui lòng điền đầy đủ tất cả các trường",
  settings_mp_success: "Đổi {login_master_password} thành công!",
  settings_export_success: "Đã tải xuống file sao lưu!",
  settings_clear_vault_confirm_title: "Xác nhận xóa vĩnh viễn",
  clear_vault_confirm_prompt_msg:
    "Hành động này sẽ XÓA SẠCH toàn bộ tài khoản, thư mục và lịch sử trong Két sắt. Thao tác này <strong class='text-error'>KHÔNG THỂ HOÀN TÁC</strong>.<br/><br/>Để xác nhận xóa vĩnh viễn Két sắt, vui lòng nhập chính xác chữ <strong class='text-error'>DELETE</strong> vào ô bên dưới:",
  clear_vault_confirm_placeholder: "Nhập DELETE để xác nhận...",
  settings_clear_vault_success:
    "Đã xóa toàn bộ tài khoản trong két sắt thành công!",
  settings_logout_title: "Đăng xuất",
  settings_logout_msg:
    "Bạn có chắc chắn muốn ngắt kết nối? Thao tác này sẽ xóa toàn bộ cấu hình cục bộ.",
  vault_sync_success: "Đồng bộ dữ liệu thành công!",
  vault_import_success:
    "Nhập thành công {count} tài khoản! Két sắt đã được cập nhật thành công.",
  vault_import_error_invalid:
    "Định dạng file không hợp lệ hoặc xác thực thất bại",
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
  gen_label_length: "Độ dài",
  gen_opt_avoid_ambiguous: "Tránh ký tự dễ nhầm lẫn (O, 0, l, 1)",
  gen_error_charset_empty: "Hãy chọn ít nhất một loại ký tự!",
  gen_error_invalid_words_count: "Số lượng từ phải từ 3 đến 20!",
  gen_btn_generate: "Tạo mật khẩu",
  gen_tab_password: "Mật khẩu",
  gen_tab_passphrase: "Cụm mật khẩu",
  gen_options_title: "Tùy chọn",
  gen_include_title: "Bao gồm",
  gen_min_numbers: "Tối thiểu chữ số",
  gen_min_specials: "Tối thiểu ký tự đặc biệt",
  gen_error_min_exceeds_length: "Số lượng tối thiểu vượt quá độ dài mật khẩu!",
  gen_label_num_words: "Số lượng từ",
  gen_label_word_separator: "Ký tự phân tách từ",
  gen_opt_capitalize: "Viết hoa chữ cái đầu",
  gen_opt_include_number: "Bao gồm số",
  gen_passphrase_hint:
    "Giá trị phải từ 3 đến 20. Sử dụng từ 6 từ trở lên để tạo cụm mật khẩu mạnh.",
  gen_btn_password_history: "Lịch sử mật khẩu",
  history_title: "Lịch sử mật khẩu",
  history_empty: "Chưa có mật khẩu nào trong lịch sử sao chép.",
  history_clear_btn: "Xóa lịch sử",
  history_confirm_clear_msg:
    "Bạn có chắc chắn muốn xóa toàn bộ lịch sử mật khẩu?",
  history_copied_toast: "Đã sao chép mật khẩu!",

  // FIDO2 Prompt View
  fido2_error_no_request: "Không có yêu cầu xác thực nào đang chờ xử lý.",
  fido2_error_load_failed: "Lỗi tải yêu cầu xác thực",
  fido2_error_create_failed: "Lỗi tạo Passkey",
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
    "Mở khóa {APP_NAME} bằng {login_master_password} để tiếp tục xác thực Passkey.",
  fido2_not_logged_in_title: "Chưa Đăng Nhập",
  fido2_not_logged_in_subtitle:
    "Vui lòng mở extension và đăng nhập vào {APP_NAME} trước khi sử dụng Passkey.",
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
  nav_generator: "Tạo mật khẩu",
  nav_reports: "Báo cáo",
  nav_settings: "Cài đặt",

  // Reports Feature
  reports_title: "Báo cáo bảo mật",
  reports_subtitle:
    "Phát hiện và vá các lỗ hổng bảo mật cho các tài khoản trực tuyến của bạn bằng cách chọn các báo cáo dưới đây.",
  report_exposed_title: "Mật khẩu rò rỉ",
  report_exposed_desc:
    "Mật khẩu bị rò rỉ trong các vụ vi phạm dữ liệu là mục tiêu dễ dàng cho kẻ tấn công. Thay đổi các mật khẩu này để ngăn chặn nguy cơ xâm nhập.",
  report_exposed_btn_check: "Kiểm tra mật khẩu rò rỉ",
  report_exposed_clean_msg:
    "Tuyệt vời! Không tìm thấy mật khẩu rò rỉ nào trong két sắt của bạn.",
  report_exposed_found_msg:
    "Cảnh báo: Phát hiện {count} mật khẩu đã bị rò rỉ dữ liệu trên internet!",
  report_reused_title: "Mật khẩu dùng lại",
  report_reused_desc:
    "Sử dụng lại mật khẩu giúp kẻ tấn công dễ dàng đột nhập vào nhiều tài khoản. Thay đổi để mỗi tài khoản có mật khẩu duy nhất.",
  report_reused_group_title: "Nhóm Mật Khẩu #{index} ({count} tài khoản)",
  report_reused_clean_msg:
    "Xuất sắc! Không có mật khẩu nào bị dùng lặp lại trong két sắt.",
  report_weak_title: "Mật khẩu yếu",
  report_weak_desc:
    "Mật khẩu yếu có thể bị kẻ tấn công dễ dàng đoán ra. Thay đổi thành mật khẩu mạnh hơn bằng trình tạo mật khẩu.",
  report_weak_clean_msg:
    "Tuyệt vời! Tất cả mật khẩu trong kho lưu trữ đều đạt tiêu chuẩn an toàn cao.",
  report_unsecure_title: "Trang web không an toàn",
  report_unsecure_desc:
    "Các URL bắt đầu bằng http:// không sử dụng mã hóa an toàn nhất. Đổi URL sang https:// để duyệt web an toàn hơn.",
  report_unsecure_btn_upgrade: "Nâng cấp sang HTTPS",
  report_unsecure_clean_msg:
    "Rất tốt! Tất cả trang web đều sử dụng kết nối mã hóa HTTPS.",
  report_inactive_2fa_title: "Chưa bật xác minh 2 bước",
  report_inactive_2fa_desc:
    "Xác minh hai bước thêm một lớp bảo vệ cho tài khoản. Hãy cài đặt mã TOTP hoặc Passkey cho các tài khoản này.",
  report_inactive_2fa_clean_msg:
    "Tốt lắm! Tất cả tài khoản đều đã được bảo vệ bằng mã TOTP hoặc Passkey.",
  report_databreach_title: "Rò rỉ dữ liệu Email",
  report_databreach_desc:
    "Các tài khoản bị vi phạm có thể tiết lộ thông tin cá nhân của bạn. Nhập địa chỉ Email bên dưới để kiểm tra rò rỉ qua hệ thống XposedOrNot.",
  report_databreach_placeholder: "Nhập địa chỉ Email cần kiểm tra...",
  report_databreach_btn_check: "Kiểm tra Email rò rỉ",
  report_databreach_clean_msg:
    "Tin vui! Địa chỉ Email này chưa bị phát hiện trong vụ vi phạm dữ liệu nào.",
  report_databreach_found_title:
    "Cảnh báo: Địa chỉ Email '{email}' đã bị rò rỉ trong các vụ vi phạm dữ liệu sau:",
  report_error_rate_limit:
    "Đã vượt quá giới hạn lượt gọi API (Rate Limit). Vui lòng thử lại sau ít phút.",
  report_error_network: "Lỗi kết nối mạng khi kiểm tra dữ liệu rò rỉ.",
  report_error_server:
    "Máy chủ kiểm tra rò rỉ gặp sự cố. Vui lòng thử lại sau.",
  report_no_username: "(Không có tên người dùng)",
  report_no_uri: "(Không có trang web)",
  report_score_label: "Điểm {score}/5",
  report_weak_btn_upgrade: "Nâng cấp mật khẩu",
  report_reused_btn_change: "Đổi mật khẩu",
  report_inactive_2fa_btn_setup: "Thiết lập 2FA",
  report_databreach_btn_checking: "Đang kiểm tra...",
  report_scanning_progress: "Đang quét ({progress}%)...",
  report_exposed_times: "Đã rò rỉ {count} lần",
  report_export_btn: "Xuất HTML",
  report_export_title: "Báo Cáo Bảo Mật Mật Khẩu Rò Rỉ - {APP_NAME}",
  report_export_heading: "Báo Cáo Bảo Mật Mật Khẩu Rò Rỉ",
  report_export_meta:
    "Được tạo bởi {APP_NAME} thông qua API Have I Been Pwned (HIBP)",
  report_export_summary:
    "Cảnh báo: Phát hiện {count} tài khoản có mật khẩu bị rò rỉ! Hãy thay đổi các mật khẩu này ngay lập tức.",
  report_export_col_account: "Tên tài khoản",
  report_export_col_username: "Tên người dùng / Email",
  report_export_col_exposure: "Mức độ rò rỉ",
  report_export_footer:
    "Kiểm toán bảo mật {APP_NAME} Vault • Bảo vệ bằng thuật toán băm k-Anonymity SHA-1",

  // Guide Page
  settings_user_guide: "Hướng dẫn sử dụng",
  settings_user_guide_sub:
    "Tìm hiểu cách sử dụng, kiến trúc bảo mật và FIDO2 Passkeys",
  settings_homepage: "Trang chủ dự án",
  settings_homepage_sub: "Ghé thăm GitHub để báo lỗi và góp ý",
  guide_search_placeholder: "Tìm kiếm chủ đề hướng dẫn...",
  guide_search_no_results: "Không tìm thấy nội dung hướng dẫn phù hợp",

  // New Guide Tree Navigation
  guide_nav_getting_started: "Khởi Đầu & Cấu Hình",
  guide_nav_vault_management: "Quản Lý Két Mật Khẩu",
  guide_nav_passkey_auth: "Passkey & Xác Thực 2FA",
  guide_nav_autofill_tools: "Tự Động Điền & Công Cụ",
  guide_nav_sync_data: "Đồng Bộ Cloud & Dữ Liệu",
  guide_nav_reports_settings: "Báo Cáo & Cài Đặt",

  guide_item_overview: "Tổng quan & Mã hóa E2EE",
  guide_item_master_password: "{login_master_password}",
  guide_item_github_gist: "Tạo GitHub Token & Cấu hình Gist",
  guide_item_self_hosted_server: "Máy chủ Cá nhân",
  guide_item_local_vault: "Két sắt Cục bộ & Cảnh báo Bảo mật",
  guide_item_auto_lock: "Khóa Két & Tự Động Khóa",

  guide_start_self_hosted_lead:
    "{login_provider_self_hosted} cho phép bạn tự vận hành hạ tầng riêng (VPS, Docker, Cloudflare Workers, NAS Synology...) làm nơi lưu trữ và đồng bộ két mật khẩu mã hóa an toàn.",
  guide_start_self_hosted_step1_title:
    "1. Nhập Địa chỉ Máy chủ (Server Base URL)",
  guide_start_self_hosted_step1_desc:
    "Nhập URL máy chủ cá nhân của bạn (hoặc sử dụng ngay máy chủ Cloudflare Worker miễn phí có sẵn tại: https://gistwarden.uongsuadaubung.workers.dev). {APP_NAME} sẽ tự động kết nối trực tiếp tới các Endpoint của máy chủ.",
  guide_start_self_hosted_step2_title:
    "2. Đăng ký hoặc Đăng nhập Tài khoản Máy chủ",
  guide_start_self_hosted_step2_desc:
    "Chuyển sang tab Đăng ký để tạo tài khoản máy chủ mới (POST /auth/register) hoặc Đăng nhập (POST /auth/login) để lấy Access Token kết nối.",
  guide_start_self_hosted_step3_title:
    "3. Khởi tạo hoặc Mở khóa Két bằng {login_master_password}",
  guide_start_self_hosted_step3_desc:
    "Sau khi lấy được Access Token, ứng dụng gọi GET /vault để kiểm tra. Nếu server trả về 200 (đã có Vault) -> Nhập {login_master_password} để Unlock; nếu 404 (chưa có Vault) -> Tạo {login_master_password} mới.",
  guide_start_self_hosted_step4_title:
    "4. Tự động Đồng bộ hóa Mã hóa Đầu-cuối (E2EE)",
  guide_start_self_hosted_step4_desc:
    "Mọi thao tác thêm/sửa/xóa mật khẩu đều được mã hóa tại Client bằng {login_master_password} trước khi đẩy qua API POST /vault. Máy chủ hoàn toàn không thể đọc được nội dung két.",
  guide_start_self_hosted_note_title:
    "Lưu ý Quan trọng về Bảo mật Mã hóa Đầu-cuối (E2EE)",
  guide_start_self_hosted_note_desc:
    "Mật khẩu tài khoản Server (Server Account Password) chỉ dùng để xác thực API với máy chủ. {login_master_password} (Master Password) dùng để tạo khóa mã hóa AES-256-GCM và KHÔNG BAO GIỜ được gửi lên máy chủ.",
  guide_self_hosted_cors_title:
    "Bắt Buộc Cấu Hình CORS Cho Phiên Bản Web (GitHub Pages)",
  guide_self_hosted_cors_desc:
    "Nếu sử dụng ứng dụng {APP_NAME} phiên bản Web (https://uongsuadaubung.github.io), máy chủ cá nhân BẮT BUỘC phải bật CORS (Access-Control-Allow-Origin: https://uongsuadaubung.github.io hoặc *) và hỗ trợ phương thức HTTP OPTIONS cho các truy vấn Preflight.",
  guide_start_self_hosted_app_title: "Hướng Dẫn Kết Nối Trên App {APP_NAME}",
  guide_start_self_hosted_app_desc:
    "Tại màn hình Đăng nhập/Khởi tạo của {APP_NAME}, chọn tab {login_provider_self_hosted}, điền Base URL, Đăng ký/Đăng nhập và bắt đầu sử dụng.",

  login_provider_select_label: "Phương thức lưu trữ Két",
  login_provider_github_gist: "Đám mây (GitHub Gist)",
  login_provider_local: "Cục bộ (Local Vault)",
  login_provider_self_hosted: "Máy chủ cá nhân",
  login_self_hosted_server_url: "Địa chỉ máy chủ",
  login_self_hosted_username: "Tên đăng nhập",
  login_self_hosted_password: "Mật khẩu tài khoản",
  login_self_hosted_btn_login: "Đăng Nhập Máy Chủ",
  login_self_hosted_btn_register: "Đăng Ký Tài Khoản",
  login_self_hosted_tab_login: "Đăng Nhập",
  login_self_hosted_tab_register: "Đăng Ký",
  login_self_hosted_forgot_password: "Quên mật khẩu?",
  login_self_hosted_forgot_password_title: "Khôi Phục Mật Khẩu",
  login_self_hosted_forgot_password_msg:
    "Vui lòng liên hệ với Quản trị viên (Admin) của máy chủ host này để được hỗ trợ khôi phục mật khẩu tài khoản của bạn.",
  login_self_hosted_forgot_mp_title: "Quên Mật Khẩu Chính Máy Chủ",
  login_self_hosted_forgot_mp_msg:
    "{APP_NAME} sử dụng cơ chế mã hóa đầu-cuối (Zero-Knowledge). {login_master_password} không bao giờ được lưu trữ trên máy chủ và <strong class='text-error'>KHÔNG THỂ KHÔI PHỤC</strong>.<br/><br/>Nếu bạn quên {login_master_password}, bạn có thể <strong>Đăng xuất</strong> ra ngoài hoặc <strong>liên hệ Quản trị viên (Admin)</strong> của máy chủ host này để hỗ trợ xóa file Két sắt đã lưu, giúp bạn tạo lại Két sắt mới với cùng tài khoản này.",

  // Server Config Modal
  server_config_modal_title: "Cấu Hình Máy Chủ Cá Nhân",
  server_config_btn_test: "Thử Kết Nối",
  server_config_btn_save: "Lưu Cấu Hình",
  server_config_test_success: "Kết nối máy chủ thành công!",
  server_config_test_failed: "Không thể kết nối tới máy chủ.",
  server_config_current_server: "Máy chủ:",
  server_config_not_set: "(Chưa cấu hình)",
  server_config_error_url_required: "Vui lòng nhập địa chỉ URL máy chủ.",
  self_hosted_error_user_exists: "Tên đăng nhập đã tồn tại trên máy chủ.",
  self_hosted_error_invalid_credentials:
    "Tên đăng nhập hoặc mật khẩu máy chủ không đúng.",
  self_hosted_error_network:
    "Lỗi kết nối tới máy chủ Self-Host. Vui lòng kiểm tra lại URL.",
  self_hosted_error_username_too_short:
    "Tên đăng nhập máy chủ phải có ít nhất 2 ký tự.",
  self_hosted_error_username_too_long:
    "Tên đăng nhập máy chủ không được vượt quá 64 ký tự.",
  self_hosted_error_password_too_short:
    "Mật khẩu máy chủ phải có ít nhất 6 ký tự.",
  self_hosted_error_missing_fields:
    "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu máy chủ.",

  guide_self_hosted_why_title: "Tại Sao Cần Bộ REST API Máy Chủ Cá Nhân Này?",
  guide_self_hosted_why_desc:
    "API {login_provider_self_hosted} được thiết kế tinh gọn với đúng 6 REST endpoints chuẩn hóa, giúp người dùng tự làm chủ hạ tầng đám mây riêng (Private Cloud/VPS) mà không cần phụ thuộc vào GitHub. Toàn bộ dữ liệu mật khẩu được mã hóa E2EE bằng AES-256-GCM tại Client trước khi gửi lên máy chủ.",
  guide_self_hosted_public_server_title:
    "Máy Chủ Cloudflare Sẵn Dùng Miễn Phí (Ready-to-Use)",
  guide_self_hosted_public_server_desc:
    "Nếu không muốn dùng GitHub Gist hay Local Vault và cũng không có điều kiện tự dựng máy chủ riêng, bạn hoàn toàn có thể sử dụng ngay máy chủ chính thức được cung cấp sẵn tại https://gistwarden.uongsuadaubung.workers.dev. Nhờ cơ chế mã hóa đầu cuối (E2EE), dữ liệu két của bạn được mã hóa hoàn toàn bằng Master Password tại máy của bạn trước khi gửi lên máy chủ, đảm bảo an toàn và riêng tư tuyệt đối.",
  guide_self_hosted_matrix_title:
    "Bảng So Sánh Tương Thích 1-to-1 Với GitHub API",
  guide_self_hosted_matrix_col_action: "Thao Tác Ứng Dụng",
  guide_self_hosted_matrix_col_github: "Luồng API GitHub Gist",
  guide_self_hosted_matrix_col_self_hosted: "Luồng API Máy Chủ Cá Nhân",
  guide_self_hosted_matrix_col_purpose: "Vai Trò & Lý Do Cần Thiết",

  guide_self_hosted_row1_action: "Đăng Ký Tài Khoản",
  guide_self_hosted_row1_github: "Tạo tài khoản trên GitHub.com",
  guide_self_hosted_row1_self_hosted: "POST /auth/register",
  guide_self_hosted_row1_purpose:
    "Tạo tài khoản người dùng mới trên máy chủ cá nhân.",

  guide_self_hosted_row2_action: "Đăng Nhập Máy Chủ",
  guide_self_hosted_row2_github: "GitHub OAuth / Token",
  guide_self_hosted_row2_self_hosted: "POST /auth/login",
  guide_self_hosted_row2_purpose:
    "Xác thực tài khoản server & nhận Bearer Access Token.",

  guide_self_hosted_row3_action: "Xác Thực Token",
  guide_self_hosted_row3_github: "GET /user",
  guide_self_hosted_row3_self_hosted: "GET /user",
  guide_self_hosted_row3_purpose:
    "Kiểm tra Access Token còn hạn và trả về thông tin người dùng.",

  guide_self_hosted_row4_action: "Kiểm Tra Vault Mới / Cũ",
  guide_self_hosted_row4_github: "GET /gists (200 OK / 404 Not Found)",
  guide_self_hosted_row4_self_hosted: "GET /vault (200 OK / 404 Not Found)",
  guide_self_hosted_row4_purpose:
    "Client dựa vào HTTP 200/404 để mở form Unlock hay Tạo {login_master_password}.",

  guide_self_hosted_row5_action: "Lưu / Cập Nhật Két",
  guide_self_hosted_row5_github: "POST / PATCH /gists",
  guide_self_hosted_row5_self_hosted: "POST /vault",
  guide_self_hosted_row5_purpose:
    "Đẩy bản lưu két sắt mã hóa E2EE mới nhất từ Client lên Server.",

  guide_self_hosted_row6_action: "Xóa Két Sắt",
  guide_self_hosted_row6_github: "DELETE /gists/{id}",
  guide_self_hosted_row6_self_hosted: "DELETE /vault",
  guide_self_hosted_row6_purpose:
    "Xóa toàn bộ dữ liệu két mật khẩu khỏi máy chủ từ xa.",

  swagger_explorer_title: "Trình khám phá REST API máy chủ cá nhân {APP_NAME}",
  swagger_base_url_label: "Base URL",
  swagger_collapse: "Thu gọn",
  swagger_expand: "Chi tiết",
  swagger_request_body_title: "Ví dụ Request Body (JSON)",
  swagger_responses_title: "Mã phản hồi & Mã trạng thái HTTP",

  swagger_ep_register_summary: "Đăng ký tài khoản người dùng máy chủ mới",
  swagger_ep_register_desc:
    "Tạo tài khoản người dùng mới trên máy chủ Self-Host và trả về Access Token.",
  swagger_res_201_title: "200 OK — Tạo tài khoản thành công",
  swagger_res_201_desc:
    "Trả về accessToken để client dùng cho các request tiếp theo.",
  swagger_res_400_title: "400 Bad Request — Dữ liệu không hợp lệ",
  swagger_res_400_desc: "Thiếu username hoặc password quá ngắn.",
  swagger_res_409_title: "409 Conflict — Username đã tồn tại",
  swagger_res_409_desc: "Tên đăng nhập đã được đăng ký trước đó trên server.",

  swagger_ep_login_summary: "Đăng nhập tài khoản máy chủ & Nhận Access Token",
  swagger_ep_login_desc:
    "Xác thực tài khoản người dùng đã có và cấp Bearer Access Token.",
  swagger_res_200_login_title: "200 OK — Đăng nhập thành công",
  swagger_res_200_login_desc: "Trả về accessToken hợp lệ.",
  swagger_res_401_login_title: "401 Unauthorized — Sai tài khoản hoặc mật khẩu",
  swagger_res_401_login_desc: "Sai thông tin xác thực tài khoản máy chủ.",

  swagger_ep_user_summary: "Xác thực Access Token & Lấy Thông Tin Người Dùng",
  swagger_ep_user_desc:
    "Kiểm tra tính hợp lệ của Access Token và trả về hồ sơ tài khoản (Username, Avatar).",

  swagger_ep_get_vault_summary:
    "Đọc Vault mã hóa, Kiểm tra Token & Trạng thái Exists/New",
  swagger_ep_get_vault_desc:
    "Tải chuỗi Vault ciphertext. Trả 200 nếu đã có Vault, 404 nếu là Vault Mới.",
  swagger_res_200_get_vault_title: "200 OK — Vault đã tồn tại (Existing Vault)",
  swagger_res_200_get_vault_desc:
    "Client đọc content, trích xuất salt và mở form Unlock.",
  swagger_res_401_token_title: "401 Unauthorized — Token không hợp lệ",
  swagger_res_401_token_desc: "Token sai hoặc đã bị thu hồi.",
  swagger_res_404_title: "404 Not Found — Chưa từng có Vault (New Vault)",
  swagger_res_404_desc:
    "Client xác định đây là Vault Mới và chuyển tới form Tạo {login_master_password}.",

  swagger_ep_post_vault_summary: "Lưu / Cập nhật chuỗi dữ liệu Vault mã hóa",
  swagger_ep_post_vault_desc:
    "Ghi đè bản sao lưu Vault mã hóa mới nhất từ Client lên Server.",
  swagger_res_200_post_vault_title: "200 OK — Đồng bộ thành công",
  swagger_res_200_post_vault_desc: "Đã lưu thành công Vault ciphertext.",
  swagger_res_401_expired_title: "401 Unauthorized — Token hết hạn",
  swagger_res_401_expired_desc: "Cần đăng nhập lại tài khoản máy chủ.",
  swagger_res_413_title: "413 Payload Too Large — Dung lượng quá lớn",
  swagger_res_413_desc:
    "Chuỗi Vault vượt quá giới hạn dung lượng của server (vd: > 10MB).",

  swagger_ep_delete_vault_summary: "Xóa toàn bộ Vault khỏi máy chủ",
  swagger_ep_delete_vault_desc:
    "Xóa tệp/bản ghi Vault của tài khoản khỏi server.",
  swagger_res_200_delete_vault_title:
    "200 OK / 204 No Content — Xóa thành công",
  swagger_res_200_delete_vault_desc: "Server đã xóa dữ liệu Vault.",
  swagger_res_401_unauthorized_title: "401 Unauthorized — Từ chối truy cập",
  swagger_res_401_unauthorized_desc: "Token không hợp lệ.",

  guide_start_local_lead:
    "Local Vault cho phép bạn lưu trữ két mật khẩu được mã hóa trực tiếp trên thiết bị hiện tại mà không cần kết nối tài khoản đám mây.",
  guide_start_local_warn_title: "Cảnh báo Quan trọng khi sử dụng Local Vault",
  guide_start_local_warn_desc:
    "Local Vault chỉ được lưu cục bộ trên thiết bị này. Việc gỡ cài đặt Extension hoặc xóa dữ liệu trình duyệt sẽ xóa sạch dữ liệu két mật khẩu. Hãy luôn chủ động Xuất file sao lưu (Export Backup) định kỳ!",
  guide_start_local_passkey_warn_title:
    "CẢNH BÁO: KHÔNG dùng chung cùng một Passkey FIDO2 giữa Local Vault và Sync Vault",
  guide_start_local_passkey_warn_desc:
    "Passkey FIDO2 vẫn hoạt động bình thường trên Local Vault của thiết bị hiện tại. Tuy nhiên, tuyệt đối KHÔNG dùng chung hay sao chép cùng một Passkey giữa Local Vault và Cloud Sync Vault trên nhiều thiết bị. Sự lệch nhịp Bộ đếm (Signature Counter) giữa các két sắt không đồng bộ sẽ khiến máy chủ nghi ngờ bị hack và CHẶN ĐĂNG NHẬP PASSKEY. Lời khuyên: Nếu muốn dùng ở nhiều thiết bị, hãy đăng ký các Passkey riêng biệt trực tiếp trên từng máy!",
  guide_start_local_card1_title: "1. Lưu trữ Mã hóa Cục bộ 100%",
  guide_start_local_card1_desc:
    "Két mật khẩu được mã hóa bằng AES-256-GCM và lưu duy nhất trong bộ nhớ trình duyệt. Không có bất kỳ dữ liệu nào được gửi lên máy chủ hay các dịch vụ lưu trữ bên ngoài.",
  guide_start_local_card2_title: "2. Nguy cơ Mất dữ liệu vĩnh viễn",
  guide_start_local_card2_desc:
    "Do không lưu trên Cloud, việc dọn dẹp dữ liệu web hoặc gỡ ứng dụng sẽ xóa sạch Két sắt. Dữ liệu một khi đã mất sẽ KHÔNG thể khôi phục!",
  guide_start_local_card3_title: "3. Sao lưu Thủ công Định kỳ",
  guide_start_local_card3_desc:
    "Luôn vào {settings_header} → {settings_vault_options_label} → {vault_options_export} để lưu file sao lưu CSV hoặc JSON mã hóa ra thư mục an toàn hoặc ổ cứng ngoài.",
  guide_start_local_card4_title: "4. Độc lập theo từng Thiết bị",
  guide_start_local_card4_desc:
    "Mỗi thiết bị dùng Local Vault sẽ có một két sắt và cấu hình riêng biệt. Thay đổi ở Máy A sẽ không tự đồng bộ sang Máy B.",
  guide_start_local_card5_title:
    "5. Rủi ro Lệch Bộ đếm (Counter) khi Dùng Passkey Đa thiết bị",
  guide_start_local_card5_desc:
    "Mỗi Passkey có một 'Bộ đếm số lần sử dụng' (Signature Counter) được máy chủ ghi nhớ. Khi dùng Passkey trên nhiều thiết bị đồng bộ không kịp thời, bộ đếm trên một máy có thể bị lùi số/lệch nhịp so với máy chủ. Khi đó máy chủ sẽ nghi ngờ bị hack/sao chép giả mạo và CHẶN đăng nhập Passkey ngay lập tức. Khuyên dùng: Hãy đăng ký Passkey riêng cho từng thiết bị.",

  guide_item_logins: "Mật khẩu Đăng nhập & Tên miền",
  guide_item_secure_notes: "Ghi chú Bảo mật",
  guide_item_cards_identities: "Thẻ Ngân hàng & Danh tính",
  guide_item_ssh_keys: "Quản lý Khóa SSH (OpenSSH)",
  guide_item_custom_fields: "Trường Tùy chỉnh (Custom Fields)",
  guide_item_folders_trash: "Thư mục & Thùng rác (Trash)",

  guide_item_passkey_concept: "Passkey (FIDO2/WebAuthn) là gì?",
  guide_item_passkey_register: "Đăng ký Passkey FIDO2 mới",
  guide_item_passkey_login: "Đăng nhập bằng Passkey",
  guide_item_totp_authenticator: "Mã 2FA (TOTP RFC 6238)",
  guide_item_google_migration: "Nhập từ Google Authenticator",

  guide_item_autofill_usage: "Tự động điền & Auto-Submit",
  guide_item_password_generator: "Trình tạo Mật khẩu CSPRNG",
  guide_item_password_history: "Lịch sử Mật khẩu đã tạo",

  guide_item_gist_sync: "Cơ chế Đồng bộ Cloud 2 chiều",
  guide_item_import_csv: "Nhập dữ liệu từ tệp CSV",
  guide_item_import_json: "Nhập tệp Sao lưu JSON",
  guide_item_export_csv: "Xuất dữ liệu ra tệp CSV",
  guide_item_export_json: "Xuất tệp Sao lưu JSON",

  guide_item_security_reports: "Báo cáo Bảo mật & HIBP",
  guide_item_appearance_lang: "Giao diện & Ngôn ngữ",
  guide_item_faq_troubleshooting: "Hỏi đáp & Khắc phục sự cố",

  guide_app_lead:
    "Tùy chỉnh giao diện Sáng/Tối (Light/Dark Mode) và Ngôn ngữ ứng dụng.",
  guide_app_theme_title: "Chủ đề Giao diện (Theme)",
  guide_app_theme_desc:
    "Chuyển đổi linh hoạt giữa giao diện Tối (Dark) và Sáng (Light) với bảng màu Bitwarden hài hòa.",
  guide_app_lang_title: "Đa ngôn ngữ (English / Tiếng Việt)",
  guide_app_lang_desc:
    "Hỗ trợ 100% giao diện và nội dung hướng dẫn bằng Tiếng Việt và Tiếng Anh.",

  guide_report_lead:
    "Kiểm tra tình trạng sức khỏe két sắt và quét lỗ hổng mật khẩu rò rỉ (HIBP).",
  guide_report_step1_title: "Báo cáo Mật khẩu Bị rò rỉ (Exposed Passwords)",
  guide_report_step1_desc:
    "Quét toàn bộ mật khẩu trong két sắt bằng công nghệ HIBP k-Anonymity (SHA-1 5 ký tự đầu). Mật khẩu của bạn hoàn toàn không bị lộ ra ngoài internet nhưng vẫn phát hiện chính xác nếu mật khẩu đã xuất hiện trong các vụ rò rỉ dữ liệu lớn trên thế giới.",
  guide_report_step2_title: "Báo cáo Mật khẩu Dùng trùng (Reused Passwords)",
  guide_report_step2_desc:
    "Phát hiện các tài khoản đang dùng chung một mật khẩu trên nhiều website khác nhau. Việc dùng trùng mật khẩu tạo nên rủi ro hiệu ứng dây chuyền khi 1 dịch vụ bị hack.",
  guide_report_step3_title: "Báo cáo Mật khẩu Yếu (Weak Passwords)",
  guide_report_step3_desc:
    "Đánh giá độ mạnh mật khẩu dựa trên độ dài, tính đa dạng ký tự (chữ hoa, chữ thường, số, ký tự đặc biệt) và phát hiện các chuỗi mật khẩu dễ đoán.",
  guide_report_step4_title:
    "Báo cáo Trang web Không An toàn (Unsecured HTTP Sites)",
  guide_report_step4_desc:
    "Cảnh báo các địa chỉ website lưu trong két sắt vẫn sử dụng giao thức http:// chưa mã hóa thay vì https:// bảo mật.",
  guide_report_step5_title: "Báo cáo Chưa bật Mã 2FA (Inactive 2FA Accounts)",
  guide_report_step5_desc:
    "Liệt kê các dịch vụ quan trọng (bancassurance, email, mạng xã hội) chưa được cấu hình mã xác thực 2 yếu tố TOTP để bạn nhanh chóng bổ sung bảo vệ.",

  // Vault Management Guides
  guide_vm_logins_lead:
    "Quản lý tài khoản đăng nhập web, địa chỉ URIs, chế độ khớp tên miền và bảo mật từng mục.",
  guide_vm_logins_card1_title:
    "Chi tiết các Chế độ khớp Tên miền (Domain Match Modes)",
  guide_vm_logins_card1_item1:
    "Base Domain (Tên miền gốc - Mặc định): Khớp tất cả các trang con (Subdomain). Ví dụ: Lưu 'https://github.com' sẽ gợi ý điền trên cả 'gist.github.com', 'education.github.com' và 'login.github.com'. Thích hợp cho 90% các dịch vụ web thông thường.",
  guide_vm_logins_card1_item2:
    "Host / Exact Host (Hostname chính xác): Chỉ khớp đúng tên miền máy chủ chính xác. Ví dụ: Lưu 'https://mail.google.com' chỉ gợi ý khi vào đúng 'mail.google.com', KHÔNG gợi ý khi vào 'drive.google.com' hay 'calendar.google.com'.",
  guide_vm_logins_card1_item3:
    "Exact / Full URL (Khớp toàn bộ URL): Khớp chính xác từng ký tự bao gồm cả Cổng (Port) và Đường dẫn (Path). Ví dụ: Lưu 'https://192.168.1.1:8080/admin/login' chỉ gợi ý đúng trang login admin này, KHÔNG gợi ý nếu vào '/user/login'. Thích hợp cho Router, Server NAS hay trang Admin nội bộ.",
  guide_vm_logins_card1_item4:
    "RegEx Pattern (Biểu thức chính quy): Khớp theo mẫu RegEx linh hoạt. Ví dụ: Lưu mẫu '^https:\\/\\/(dev|staging)\\.company\\.com' sẽ khớp và gợi ý trên cả 'dev.company.com' và 'staging.company.com', nhưng tự động bỏ qua 'prod.company.com'. Thích hợp cho Lập trình viên & SysAdmin.",
  guide_vm_logins_card1_item5:
    "Never (Không bao giờ gợi ý): Tuyệt đối KHÔNG hiển thị gợi ý tự động điền tài khoản này trên bất kỳ trang web nào (chống bị mã độc trên web rình rập điền tự động). Thích hợp cho các tài khoản cực kỳ nhạy cảm chỉ muốn copy thủ công khi cần.",
  guide_vm_logins_card2_title: "Lưu Nhiều Địa Chỉ URIs",
  guide_vm_logins_card2_desc:
    "Mỗi tài khoản đăng nhập cho phép thêm nhiều địa chỉ URI khác nhau với các chế độ khớp riêng biệt cho từng URI.",
  guide_vm_logins_card3_title:
    "Yêu cầu {login_master_password} ({login_master_password} Re-prompt)",
  guide_vm_logins_card3_desc:
    "Bật tùy chọn này cho các tài khoản tài chính hoặc ứng dụng nhạy cảm. Mỗi khi mở xem, chỉnh sửa hoặc sao chép mật khẩu, hệ thống sẽ buộc bạn gõ lại {login_master_password} để xác minh danh tính.",
  guide_vm_logins_card4_title:
    "Lịch sử Mật khẩu Tài khoản (Item Password History)",
  guide_vm_logins_card4_desc:
    "Mỗi khi bạn thay đổi mật khẩu của một tài khoản, {APP_NAME} sẽ tự động lưu bản ghi mật khẩu cũ vào lịch sử riêng của mục đó. Bạn có thể mở xem chi tiết tài khoản ➔ chọn 'Lịch sử mật khẩu' để tra cứu hoặc khôi phục lại mật khẩu cũ bất cứ lúc nào.",

  guide_vm_notes_lead:
    "Lưu trữ an toàn các văn bản bí mật, mã khôi phục tài khoản, số sê-ri phần mềm hoặc thông tin cá nhân quan trọng.",
  guide_vm_notes_card_title: "Bảo mật nội dung ghi chú",
  guide_vm_notes_card_desc:
    "Tất cả văn bản trong Ghi chú bảo mật được mã hóa trực tiếp trên thiết bị trước khi đồng bộ. Bạn cũng có thể bật tùy chọn Yêu cầu nhập lại {login_master_password} khi mở xem nội dung này.",

  guide_vm_cards_lead:
    "Lưu giữ thông tin thẻ thanh toán (Credit Card) và danh tính cá nhân để tự động điền form đăng ký, thanh toán nhanh chóng.",
  guide_vm_cards_card1_title: "Thẻ Thanh Toán (Credit Cards)",
  guide_vm_cards_card1_desc:
    "Lưu số thẻ, mã CVV, ngày hết hạn và chủ thẻ. Dữ liệu CVV luôn được bảo vệ bằng lớp mã hóa an toàn.",
  guide_vm_cards_card2_title: "Danh Tính Cá Nhân (Identities)",
  guide_vm_cards_card2_desc:
    "Lưu họ tên, số điện thoại, địa chỉ, số CMND/CCCD/Passport để tự động điền các biểu mẫu mua hàng hoặc đăng ký dịch vụ trực tuyến.",

  guide_vm_ssh_lead:
    "Quản lý các cặp khóa SSH Public/Private Key dùng để truy cập máy chủ từ xa an toàn.",
  guide_vm_ssh_card_title: "Quản lý SSH Key chuyên nghiệp",
  guide_vm_ssh_card_desc:
    "Lưu trữ khóa riêng tư (Private Key) dạng OpenSSH/PEM cùng với Fingerprint và Mật khẩu bảo vệ của khóa.",

  guide_vm_fields_lead:
    "Mở rộng trường dữ liệu linh hoạt cho các mục trong Két sắt, giúp điền tự động chính xác mọi biểu mẫu đăng nhập phức tạp.",
  guide_vm_fields_card_title: "4 Kiểu Trường Tùy Chỉnh (Custom Fields)",
  guide_vm_fields_item1: "Text: Lưu trữ chuỗi văn bản thông thường.",
  guide_vm_fields_item2: "Hidden: Văn bản bảo mật được ẩn ký tự.",
  guide_vm_fields_item3: "Checkbox: Hộp kiểm bật/tắt (True/False).",
  guide_vm_fields_item4:
    "Linked: Trường liên kết động từ Username/Password/2FA.",
  guide_vm_fields_type_text_title: "1. Trường Văn bản (Text)",
  guide_vm_fields_type_text_desc:
    "Lưu trữ các thông tin văn bản tĩnh như: Mã khách hàng, Tên tổ chức/Tenant, Domain công ty, hoặc Số hiệu tài khoản. Khi tự động điền (Autofill), tiện ích sẽ điền chuỗi này vào ô input tương ứng trên trang web.",
  guide_vm_fields_type_hidden_title: "2. Trường Ẩn (Hidden)",
  guide_vm_fields_type_hidden_desc:
    "Lưu trữ các chuỗi nhạy cảm cần bảo mật như: Mã PIN phụ, câu trả lời bí mật, hoặc chuỗi khóa bí mật. Giá trị được che mờ (dạng chấm ••••) trên giao diện và được điền an toàn vào form đăng nhập.",
  guide_vm_fields_type_checkbox_title: "3. Hộp kiểm (Checkbox)",
  guide_vm_fields_type_checkbox_desc:
    "Lưu trữ trạng thái Bật/Tắt (True/False). Khi Autofill, tiện ích sẽ tự động tích chọn hoặc bỏ chọn hộp kiểm trên biểu mẫu web (ví dụ: 'Ghi nhớ đăng nhập', 'Thiết bị tin cậy', 'Tôi đồng ý điều khoản').",
  guide_vm_fields_type_linked_title: "4. Trường Liên kết (Linked)",
  guide_vm_fields_type_linked_desc:
    "Giải pháp đặc trị cho các trang web dùng thuộc tính ô đăng nhập bất quy tắc (ví dụ: id='txt_user_code', name='auth_secret'). Tự động lấy giá trị trực tiếp từ Tên đăng nhập, Mật khẩu hoặc mã 2FA TOTP hiện tại để điền vào đúng vị trí.",
  guide_vm_fields_linked_guide_title:
    "Hướng dẫn sử dụng Trường Liên Kết (Linked Fields)",
  guide_vm_fields_linked_step1_title:
    "Bước 1: Xác định tên ô input trên trang web",
  guide_vm_fields_linked_step1_desc:
    "Chuột phải vào ô input cần điền trên trang web và chọn 'Kiểm tra' (Inspect). Tìm xem thuộc tính 'id', 'name', 'placeholder' hoặc 'aria-label' của ô đó là gì (ví dụ: 'login_username' hoặc 'member_pwd').",
  guide_vm_fields_linked_step2_title:
    "Bước 2: Thêm trường Linked vào mục Két sắt",
  guide_vm_fields_linked_step2_desc:
    "Mở mục Két sắt cần chỉnh sửa → bấm 'Thêm trường tùy chỉnh' → chọn Loại trường là 'Trường liên kết (Linked)'. Nhập Tên trường trùng với thuộc tính vừa xem ở Bước 1 → Chọn Giá trị liên kết là 'Tên đăng nhập', 'Mật khẩu' hoặc 'Mã xác thực 2FA (TOTP)'.",
  guide_vm_fields_linked_step3_title: "Bước 3: Tự động điền chính xác 100%",
  guide_vm_fields_linked_step3_desc:
    "Khi truy cập trang web và bấm Autofill (hoặc dùng gợi ý thông báo / phím tắt), tiện ích sẽ tự động ánh xạ dữ liệu tài khoản vào đúng các ô input đó.",
  guide_vm_fields_matching_title: "Quy tắc Nhận diện & Khớp trường Autofill",
  guide_vm_fields_matching_desc:
    "Hệ thống Autofill của Gistwarden tự động đối chiếu Tên trường (không phân biệt chữ hoa/thường) theo thứ tự ưu tiên: 1. Thuộc tính 'id' → 2. Thuộc tính 'name' → 3. Thuộc tính 'placeholder' → 4. Thuộc tính 'aria-label' hoặc thẻ '<label>'.",

  guide_vm_folders_lead:
    "Tự do phân loại dữ liệu theo Thư mục và quản lý an toàn các mục bị xóa trong Thùng rác.",
  guide_vm_folders_sec1_title: "1. Tạo & Quản lý Thư mục (Folders)",
  guide_vm_folders_step1_title: "Tạo thư mục mới",
  guide_vm_folders_step1_desc:
    "Mở {APP_NAME} → chọn {settings_header} → {settings_vault_options_label} → {folder_management_title}. Nhập tên thư mục mới và nhấn Lưu.",
  guide_vm_folders_step2_title: "Gán mục vào Thư mục",
  guide_vm_folders_step2_desc:
    "Khi Thêm hoặc Chỉnh sửa một mục trong Két sắt, chọn thư mục mong muốn tại trường 'Thư mục'. Hoặc tại danh sách Két sắt, chọn các mục và bấm 'Di chuyển vào thư mục'.",
  guide_vm_folders_step3_title: "Chỉnh sửa hoặc Xóa thư mục",
  guide_vm_folders_step3_desc:
    "Trong danh sách Thư mục, bấm biểu tượng Chỉnh sửa để đổi tên hoặc biểu tượng Thùng rác để xóa thư mục (Lưu ý: Xóa thư mục không làm mất các tài khoản bên trong).",
  guide_vm_trash_sec2_title: "2. Quản lý Thùng Rác & Khôi Phục (Trash)",
  guide_vm_trash_step1_title: "Chuyển mục vào Thùng rác",
  guide_vm_trash_step1_desc:
    "Khi bấm Xóa một mục trong Két sắt, mục đó sẽ được chuyển an toàn vào Thùng rác để phòng trường hợp xóa nhầm.",
  guide_vm_trash_step2_title: "Truy cập Thùng rác & Khôi phục",
  guide_vm_trash_step2_desc:
    "Mở {APP_NAME} → chọn {settings_header} → {settings_vault_options_label} → {trash_title}. Nhấn nút 'Khôi phục' bên cạnh mục cần lấy lại về Két sắt.",
  guide_vm_trash_step3_title: "Xóa vĩnh viễn (Purge)",
  guide_vm_trash_step3_desc:
    "Bấm 'Xóa vĩnh viễn' từng mục hoặc 'Xóa sạch thùng rác' để xóa hoàn toàn khỏi thiết bị và GitHub Gist. Lưu ý: Dữ liệu sau khi xóa vĩnh viễn không thể khôi phục.",

  // Getting Started Guides
  guide_start_ov_lead:
    "{APP_NAME} là giải pháp két mật khẩu cá nhân mã hóa Zero-Knowledge, tự động đồng bộ hóa đám mây riêng tư thông qua GitHub Gist.",
  guide_start_ov_card1_title: "Mã Hóa Bảo Mật Tuyệt Đối (Zero-Knowledge)",
  guide_start_ov_card1_desc:
    "Toàn bộ dữ liệu mật khẩu của bạn đều được mã hóa trực tiếp trên thiết bị của bạn trước khi truyền đi hoặc lưu trữ. Tuyệt đối không ai (kể cả nhà phát triển hay nhà cung cấp dịch vụ lưu trữ) có thể đọc được dữ liệu nếu không có {login_master_password} của bạn.",
  guide_start_ov_card2_title: "Đồng Bộ Đám Mây Cá Nhân Riêng Tư",
  guide_start_ov_card2_desc:
    "Thay vì gửi dữ liệu về máy chủ trung gian của bên thứ 3, {APP_NAME} trực tiếp đồng bộ dữ liệu vào một tệp bí mật (Private Gist) trên tài khoản GitHub cá nhân của chính bạn.",
  guide_start_ov_card3_title: "Đăng Nhập Không Mật Khẩu (Passkeys)",
  guide_start_ov_card3_desc:
    "Hỗ trợ lưu trữ và đăng nhập nhanh chóng bằng Passkey (FIDO2 / WebAuthn) với vân tay, khuôn mặt hoặc mã PIN thiết bị, loại bỏ hoàn toàn rủi ro lộ mật khẩu.",

  guide_start_mp_lead:
    "{login_master_password} ({login_master_password}) là chìa khóa duy nhất dùng để giải mã và bảo vệ toàn bộ dữ liệu két sắt của bạn.",
  guide_start_mp_step1_title: "1. Vai trò của {login_master_password}",
  guide_start_mp_step1_desc:
    "{login_master_password} vừa đóng vai trò mở khóa két sắt, vừa dùng làm chìa khóa gốc để mã hóa toàn bộ mật khẩu, ghi chú và tài khoản. Hãy tạo {login_master_password} đủ dài, dễ nhớ với bạn nhưng khó đoán với người khác.",
  guide_start_mp_step2_title:
    "2. Nguyên tắc Không lưu trữ {login_master_password}",
  guide_start_mp_step2_desc:
    "{APP_NAME} tuân thủ nguyên tắc Zero-Knowledge: ứng dụng tuyệt đối không bao giờ lưu trữ hay gửi {login_master_password} lên bất kỳ máy chủ nào. Nếu bạn quên {login_master_password}, dữ liệu sẽ không thể khôi phục.",
  guide_start_mp_step3_title: "3. Cách thay đổi {login_master_password}",
  guide_start_mp_step3_desc:
    "Bạn có thể đổi {login_master_password} bất cứ lúc nào bằng cách mở ứng dụng → chọn {settings_header} → {settings_account_security} → {settings_change_mp}. Khi đổi, hệ thống sẽ tự động giải mã và mã hóa lại toàn bộ két sắt bằng chìa khóa mới.",

  guide_start_lock_lead:
    "Tự động bảo vệ dữ liệu két mật khẩu khi bạn không thao tác hoặc khi khởi động lại trình duyệt.",
  guide_start_lock_step1_title: "1. Mở Cài đặt An toàn tài khoản",
  guide_start_lock_step1_desc:
    "Mở ứng dụng {APP_NAME} → truy cập mục {settings_header} → {settings_account_security}.",
  guide_start_lock_step2_title: "2. Tùy chỉnh Thời gian chờ (Vault Timeout)",
  guide_start_lock_step2_desc:
    "Lựa chọn thời gian tự động xử lý khi không có thao tác: Khi khởi động lại trình duyệt (On Restart), 1 phút, 5 phút, 15 phút, 30 phút, 1 giờ, hoặc 4 giờ.",
  guide_start_lock_step3_title:
    "3. Lựa chọn Hành động khi hết thời gian (Timeout Action)",
  guide_start_lock_step3_lock:
    "Khóa két (Lock): Xóa chìa khóa giải mã khỏi bộ nhớ RAM. Yêu cầu nhập {login_master_password} hoặc Mã PIN để mở lại.",
  guide_start_lock_step3_logout:
    "Đăng xuất (Log out): Xóa toàn bộ trạng thái phiên và yêu cầu đăng nhập lại từ đầu.",
  guide_start_lock_step4_title:
    "4. Mã PIN mở khóa nhanh & Yêu cầu {login_master_password}",
  guide_start_lock_step4_desc:
    "Kích hoạt tùy chọn Mở khóa bằng Mã PIN (Unlock with PIN) để mở két mượt mà. Đánh dấu chọn Yêu cầu {login_master_password} khi khởi động lại trình duyệt để đảm bảo an toàn tuyệt đối khi tắt mở trình duyệt.",

  guide_start_pin_title: "Cấu hình & Sử dụng Mã PIN Mở Khóa Nhanh",
  guide_start_pin_lead:
    "Mã PIN giúp bạn mở khóa két nhanh chóng bằng một chuỗi số ngắn mà không cần nhập lại {login_master_password} dài phức tạp mỗi lần sử dụng.",
  guide_start_pin_step1_title: "1. Bật tùy chọn Mở khóa bằng Mã PIN",
  guide_start_pin_step1_desc:
    "Mở ứng dụng {APP_NAME} ➔ chọn {settings_header} ➔ {settings_account_security}. Tích chọn vào ô 'Mở khóa bằng mã PIN' (Unlock with PIN).",
  guide_start_pin_step2_title: "2. Thiết lập Mã PIN mới (Tối thiểu 4 chữ số)",
  guide_start_pin_step2_desc:
    "Cửa sổ Thiết lập mã PIN sẽ xuất hiện. Hãy nhập mã PIN dễ nhớ với bạn (tối thiểu 4 ký tự/chữ số) và bấm 'Xác nhận' để lưu cấu hình.",
  guide_start_pin_step3_title: "3. Mở khóa nhanh bằng PIN khi két bị khóa",
  guide_start_pin_step3_desc:
    "Khi két mật khẩu bị khóa theo thời gian chờ, bạn chỉ cần gõ Mã PIN và nhấn 'Mở khóa'. Chìa khóa mã hóa sẽ tự động mở mà không cần gõ lại {login_master_password}.",
  guide_start_pin_note_title: "Lưu ý bảo mật quan trọng về Mã PIN:",
  guide_start_pin_note_desc:
    "Mã PIN chỉ được lưu an toàn trong bộ nhớ thiết bị. Nếu bạn nhập sai Mã PIN 3 lần liên tiếp, hệ thống sẽ tự động hủy Mã PIN và đăng xuất để bảo vệ an toàn. Đồng thời, khi bạn Đăng xuất tài khoản lưu trữ, Mã PIN cũng sẽ tự động được xóa bỏ.",

  // Passkey & TOTP Authenticator Guides
  guide_passkey_concept_lead:
    "Passkey (chuẩn FIDO2 / WebAuthn) là giải pháp đăng nhập không dùng mật khẩu bảo mật nhất hiện nay, chống lừa đảo (Anti-Phishing) tuyệt đối.",
  guide_passkey_concept_card1_title: "Chống Phishing Tuyệt Đối",
  guide_passkey_concept_card1_desc:
    "Passkey gắn liền với tên miền chính xác của trang web. Dù bạn vô tình truy cập một trang web lừa đảo giả mạo, Passkey sẽ không bao giờ phản hồi.",
  guide_passkey_concept_card2_title: "Công Nghệ Cặp Khóa Bảo Mật Bất Đối Xứng",
  guide_passkey_concept_card2_desc:
    "Mỗi Passkey bao gồm khóa công khai gửi lên trang web và khóa riêng tư được bảo vệ mã hóa an toàn trong két sắt {APP_NAME} của bạn.",

  guide_passkey_gmig_lead:
    "Chuyển đổi dữ liệu mã 2FA từ ứng dụng Google Authenticator sang {APP_NAME}.",
  guide_passkey_gmig_step1_title: "1. Mở ứng dụng Google Authenticator",
  guide_passkey_gmig_step1_desc:
    "Mở Google Authenticator trên điện thoại của bạn.",
  guide_passkey_gmig_step2_title: "2. Mở Menu Chuyển tài khoản",
  guide_passkey_gmig_step2_desc:
    "Nhấn vào nút Menu góc trên và chọn Chuyển tài khoản (Transfer codes).",
  guide_passkey_gmig_step3_title: "3. Chọn Xuất tài khoản",
  guide_passkey_gmig_step3_desc: "Chọn Xuất tài khoản (Export codes).",
  guide_passkey_gmig_step4_title: "4. Chọn các mã 2FA muốn xuất",
  guide_passkey_gmig_step4_desc:
    "Tích chọn các mã 2FA bạn muốn chuyển sang {APP_NAME}.",
  guide_passkey_gmig_step5_title: "5. Quét mã QR sang {APP_NAME}",
  guide_passkey_gmig_step5_desc:
    "Mã QR xuất tài khoản sẽ hiển thị. Mở {APP_NAME} → {settings_header} → {settings_vault_options_label} → {settings_tools_google_auth} để quét hoặc tải ảnh mã QR này lên.",

  // Autofill & Password Generator Guides
  guide_auto_lead:
    "Tự động nhận diện biểu mẫu và điền Tên đăng nhập / Mật khẩu trên các trang web.",
  guide_auto_card1_title: "Biểu tượng {APP_NAME} trên ô nhập liệu",
  guide_auto_card1_desc:
    "Khi bấm vào ô đăng nhập trên bất kỳ trang web nào, biểu tượng {APP_NAME} sẽ xuất hiện cho phép bạn chọn tài khoản và tự động điền ngay lập tức.",
  guide_auto_card2_title: "Tự động gửi biểu mẫu (Auto-Submit)",
  guide_auto_card2_desc:
    "Bạn có thể bật tùy chọn Tự động gửi biểu mẫu sau khi điền tại mục {settings_header} → {settings_autofill_options_label} để đăng nhập nhanh 1-click.",

  guide_pwdgen_lead:
    "Tạo mật khẩu ngẫu nhiên hoặc cụm từ mật khẩu an toàn cao, chống lại mọi đòn tấn công dò tìm.",
  guide_pwdgen_step1_title: "1. Vị trí Công cụ Tạo Mật khẩu",
  guide_pwdgen_step1_desc:
    "Mở ứng dụng {APP_NAME} → chuyển tới tab {nav_generator} trên thanh điều hướng (hoặc nhấn biểu tượng Tạo mật khẩu khi đang thêm/sửa tài khoản).",
  guide_pwdgen_step2_title: "2. Chế độ Mật khẩu Ngẫu nhiên (Random Password)",
  guide_pwdgen_step2_length:
    "Tùy chỉnh độ dài: Kéo chọn độ dài mật khẩu từ 5 đến 128 ký tự (khuyên dùng từ 16 ký tự trở lên).",
  guide_pwdgen_step2_charset:
    "Tập ký tự: Tùy chọn bật/tắt Chữ hoa (A-Z), Chữ thường (a-z), Chữ số (0-9) và Ký tự đặc biệt (!@#$%^...).",
  guide_pwdgen_step2_ambiguous:
    "Tránh ký tự dễ nhầm (Avoid Ambiguous): Bật tùy chọn này để loại bỏ các ký tự khó phân biệt khi đọc hoặc gõ tay như I, l, 1, O, 0.",
  guide_pwdgen_step3_title: "3. Chế độ Cụm Từ Mật Khẩu (Passphrase)",
  guide_pwdgen_step3_desc:
    "Tạo mật khẩu bằng cách ghép nhiều từ vựng tiếng Anh lại với nhau. Giúp bạn tạo mật khẩu có độ dài lớn nhưng cực kỳ dễ ghi nhớ trong đầu. Cho phép chọn số lượng từ (từ 3 đến 20 từ), ký tự nối (dấu -), viết hoa chữ cái đầu và chèn chữ số.",
  guide_pwdgen_step4_title: "4. Thanh đánh giá Độ mạnh Mật khẩu",
  guide_pwdgen_step4_desc:
    "Thanh màu sắc bên dưới sẽ đánh giá trực quan độ an toàn của mật khẩu theo các mức: Yếu, Trung bình, Mạnh hoặc Cực mạnh để bạn yên tâm sử dụng.",

  guide_hist_lead: "Lịch sử các mật khẩu đã được tạo gần đây.",
  guide_hist_card_title: "Tra cứu mật khẩu đã tạo",
  guide_hist_card_desc:
    "Tất cả mật khẩu ngẫu nhiên được tạo bằng bộ Generator sẽ được lưu vào lịch sử ngắn hạn để bạn khôi phục lại trong trường hợp quên chưa lưu vào két.",

  // Sync & Import/Export Data Guides
  guide_sync_lead:
    "Đồng bộ dữ liệu hai chiều riêng tư giữa thiết bị và GitHub Gist cá nhân.",
  guide_sync_card1_title: "Tự động Hợp nhất Dữ liệu Mới nhất",
  guide_sync_card1_desc:
    "Khi đồng bộ trên nhiều thiết bị khác nhau, {APP_NAME} tự động so sánh thời gian chỉnh sửa để hợp nhất dữ liệu mới nhất của từng tài khoản mà không gây mất mát thông tin.",
  guide_sync_card2_title: "Lưu trữ Đám mây Cá nhân Bí mật",
  guide_sync_card2_desc:
    "Dữ liệu két sắt được lưu trữ trên tệp GitHub Gist cá nhân của bạn dưới dạng mã hóa hoàn toàn. Nếu mở xem trên GitHub, người khác chỉ thấy chuỗi ký tự mã hóa vô nghĩa.",

  guide_imp_csv_lead:
    "Nhập danh sách mật khẩu từ tệp CSV của các Trình duyệt Web và Bitwarden vào {APP_NAME}.",
  guide_imp_csv_step1_title:
    "1. Nhập tệp CSV từ Trình duyệt Web (Chrome, Firefox, Edge, Brave, Safari)",
  guide_imp_csv_step1_desc:
    "Xuất tệp CSV từ phần Cài đặt mật khẩu của trình duyệt web bạn đang dùng. {APP_NAME} sẽ tự động nhận diện và nạp toàn bộ danh sách tài khoản đăng nhập vào két sắt.",
  guide_imp_csv_step2_title: "2. Nhập tệp CSV từ Bitwarden",
  guide_imp_csv_step2_desc:
    "Xuất tệp CSV từ Bitwarden để chuyển sang {APP_NAME}. Ứng dụng sẽ nạp toàn bộ mật khẩu, ghi chú và tự động tái tạo lại các Thư mục tương ứng.",
  guide_imp_csv_step3_title: "3. Các bước thao tác trong ứng dụng",
  guide_imp_csv_step3_desc:
    "Mở {APP_NAME} → chọn {settings_header} → {settings_vault_options_label} → {vault_options_import}. Chọn chuẩn tệp (Browser CSV hoặc Bitwarden CSV), chọn tệp từ máy tính và nhấn Xác nhận nhập.",

  guide_imp_json_lead:
    "Khôi phục 100% trọn vẹn cấu trúc dữ liệu két mật khẩu từ tệp Sao lưu định dạng JSON.",
  guide_imp_json_step1_title: "1. Vị trí chức năng Nhập dữ liệu",
  guide_imp_json_step1_desc:
    "Mở ứng dụng {APP_NAME} → chọn menu {settings_header} → {settings_vault_options_label} → {vault_options_import}.",
  guide_imp_json_step2_title: "2. Chọn định dạng tệp JSON",
  guide_imp_json_step2_desc:
    "Tại danh sách chọn định dạng tệp, chọn {APP_NAME} / Bitwarden JSON (.json).",
  guide_imp_json_step3_title: "3. Tải tệp JSON & Xem trước kết quả",
  guide_imp_json_step3_desc:
    "Nhấn nút chọn tệp JSON từ máy tính. {APP_NAME} sẽ hiển thị bảng Xem trước kết quả (Preview) số lượng tài khoản chuẩn bị nạp vào két.",
  guide_imp_json_step4_title: "4. Khôi phục đầy đủ cả 5 nhóm dữ liệu & Thư mục",
  guide_imp_json_step4_desc:
    "Tệp JSON giúp khôi phục trọn vẹn 100% cả 5 nhóm dữ liệu: Mật khẩu, Ghi chú bảo mật, Thẻ thanh toán, Danh tính, Khóa SSH cùng Thư mục, Trường tùy chỉnh và mã 2FA.",
  guide_imp_json_step5_title: "5. Tự động Hợp nhất Dữ liệu & Thư mục",
  guide_imp_json_step5_desc:
    "Hệ thống tự động gộp các Thư mục trùng tên, loại bỏ bản ghi trùng lặp và giữ lại dữ liệu mới nhất.",

  guide_exp_csv_lead:
    "Xuất danh sách mật khẩu ra tệp định dạng CSV để dễ dàng xem hoặc chuyển đổi ứng dụng.",
  guide_exp_csv_step1_title: "1. Truy cập tính năng Xuất dữ liệu",
  guide_exp_csv_step1_desc:
    "Mở ứng dụng {APP_NAME} → chọn menu {settings_header} → {settings_vault_options_label} → {vault_options_export}.",
  guide_exp_csv_step2_title:
    "2. Nhập {login_master_password} để xác minh bảo mật",
  guide_exp_csv_step2_desc:
    "Để bảo vệ an toàn, ứng dụng yêu cầu bạn nhập lại {login_master_password} ({login_master_password}) để xác nhận quyền truy cập trước khi tạo tệp CSV.",
  guide_exp_csv_step3_title: "3. Lựa chọn định dạng tệp CSV",
  guide_exp_csv_step3_browser:
    "Browser CSV: Xuất dạng định dạng cơ bản để nạp trực tiếp vào Google Chrome, Firefox, Edge, Safari, Brave.",
  guide_exp_csv_step3_bitwarden:
    "Bitwarden CSV: Xuất đầy đủ thông tin tài khoản và cấu trúc Thư mục.",
  guide_exp_csv_step4_title: "4. Cảnh báo bảo mật tệp CSV chữ rõ (Plaintext)",
  guide_exp_csv_step4_desc:
    "Tệp CSV chứa mật khẩu chưa mã hóa (chỉ bao gồm các mục Mật khẩu & Ghi chú, không chứa Passkey hay Khóa SSH). Hãy bảo quản tệp cẩn thận hoặc xóa sau khi di chuyển xong.",

  guide_exp_json_lead:
    "Tạo bản sao lưu toàn bộ két mật khẩu dưới dạng tệp JSON.",
  guide_exp_json_step1_title: "1. Sao lưu 100% cấu trúc Vault",
  guide_exp_json_step1_desc:
    "Tệp JSON sao lưu toàn bộ 5 nhóm phần tử (Mật khẩu, Ghi chú, Thẻ, Danh tính, Khóa SSH), Thư mục, Yêu thích và Trường tùy chỉnh.",
  guide_exp_json_step2_title: "2. Tùy chọn Xuất Mã hóa hoặc Không Mã hóa",
  guide_exp_json_step2_desc:
    "Nên chọn Xuất mã hóa (Encrypted JSON) để tệp sao lưu được bảo vệ bằng {login_master_password} của bạn. Người khác không thể mở nếu không có {login_master_password}.",
  guide_exp_json_step3_title: "3. Các bước xuất tệp sao lưu JSON",
  guide_exp_json_step3_desc:
    "Mở {APP_NAME} → chọn {settings_header} → {settings_vault_options_label} → {vault_options_export} → nhập {login_master_password} → chọn định dạng JSON và nhấn Tải tệp Sao lưu JSON.",

  // Extension Downloads Guide
  guide_item_download_extension: "Tải Extension",
  guide_dl_ext_lead:
    "Cài đặt Extension {APP_NAME} trên trình duyệt để trải nghiệm tính năng Tự động điền, Passkey FIDO2 và Tự động khóa két bảo mật.",
  guide_dl_ext_firefox_title: "Trình duyệt Firefox (Firefox Add-on)",
  guide_dl_ext_firefox_desc:
    "Tải và cài đặt Extension {APP_NAME} chính thức trên Mozilla Firefox Add-ons Store.",
  guide_dl_ext_edge_title: "Trình duyệt Microsoft Edge (Edge Add-on)",
  guide_dl_ext_edge_desc:
    "Tải và cài đặt Extension {APP_NAME} chính thức trên Microsoft Edge Add-ons Store.",
  guide_dl_ext_btn: "Cài đặt Extension",

  // Web Version Guide
  guide_item_web_version: "Phiên bản Web",
  guide_web_ver_lead:
    "Truy cập két mật khẩu {APP_NAME} trực tiếp trên trình duyệt web mà không cần cài đặt Extension.",
  guide_web_ver_btn: "Truy cập {APP_NAME} Web",
  guide_web_ver_advantages_title: "Truy cập linh hoạt mọi nơi",
  guide_web_ver_advantages_desc:
    "Thích hợp khi bạn sử dụng máy tính công cộng, thiết bị lạ hoặc môi trường trình duyệt không cho phép cài đặt Extension.",
  guide_web_ver_limits_title: "Các tính năng bị giới hạn trên phiên bản Web",
  guide_web_ver_limit_autofill_title: "Không có Tự động điền (Autofill)",
  guide_web_ver_limit_autofill_desc:
    "Phiên bản Web không thể tự động điền tài khoản và mật khẩu vào biểu mẫu đăng nhập trên các trang web khác.",
  guide_web_ver_limit_passkey_title: "Hạn chế Passkey / FIDO2",
  guide_web_ver_limit_passkey_desc:
    "Không thể đóng vai trò làm trình quản lý Passkey cho trình duyệt để xác thực đăng nhập trên các trang web bên ngoài.",
  guide_web_ver_limit_capture_title: "Không tự động bắt đăng nhập mới",
  guide_web_ver_limit_capture_desc:
    "Không thể tự động phát hiện và gợi ý lưu mật khẩu khi bạn đăng nhập trên các trang web.",

  // Guide Gist Token Steps
  guide_token_desc:
    "Để đồng bộ đám mây, {APP_NAME} sẽ lưu két sắt đã mã hóa vào mục GitHub Gist cá nhân của bạn. Bạn cần tạo một mã Token có quyền Gist.",
  guide_token_step1_title: "Bước 1: Đặt tên và hạn dùng",
  guide_token_step1_desc:
    "Đăng nhập GitHub, bấm nút màu xanh bên dưới để mở nhanh trang tạo Token. Hãy đặt một cái tên dễ nhớ (ví dụ: '{APP_NAME}') và chọn hạn dùng là 'No expiration' (Không hết hạn) để không bị lỗi đồng bộ sau này.",
  guide_token_step2_title: "Bước 2: Tích chọn quyền Gist",
  guide_token_step2_desc:
    "Tìm và tích chọn vào ô 'gist' (để đồng bộ két sắt). Quyền này chỉ cho phép {APP_NAME} truy cập gist, hoàn toàn không xem được các repository code riêng tư khác của bạn.",
  guide_token_step3_title: "Bước 3: Tạo mã Token",
  guide_token_step3_desc:
    "Cuộn xuống cuối trang rồi nhấn nút 'Generate token' màu xanh lá để tạo mã.",
  guide_token_step4_title: "Bước 4: Copy và dán vào cài đặt",
  guide_token_step4_desc:
    "Copy mã Token vừa hiển thị (dãy ký tự bắt đầu bằng ghp_). Sau đó mở {APP_NAME}, chọn 'Dùng Token (PAT)', dán vào ô GitHub Token rồi nhấn nút Lưu.",
  guide_token_important_note: "Lưu ý quan trọng:",
  guide_token_note_desc:
    " Tuyệt đối KHÔNG đưa mã Token này cho bất kỳ ai. Extension chỉ lưu Token ngay trên máy tính của bạn và gửi trực tiếp tới GitHub, không đi qua máy chủ trung gian nào khác.",

  // Guide Passkey Registration Steps
  guide_pk_reg_desc:
    "Để bắt đầu sử dụng đăng nhập không mật khẩu, hãy làm theo hướng dẫn 3 bước dưới đây để lưu Passkey mới vào két sắt của bạn.",
  guide_pk_reg_step1_title: "Bước 1: Bấm đăng ký trên trang web",
  guide_pk_reg_step1_desc:
    "Khi bạn đang ở trang quản lý bảo mật của trang web (ví dụ: Google, GitHub, webauthn.me), hãy bấm nút đăng ký Passkey mới (hoặc 'Add a passkey').",
  guide_pk_reg_step2_title: "Bước 2: Chọn tài khoản lưu trữ",
  guide_pk_reg_step2_desc:
    "{APP_NAME} sẽ tự động phát hiện và chặn yêu cầu của trình duyệt để hiển thị popup. Hãy chọn tài khoản khớp có sẵn trong két sắt để liên kết, hoặc chọn 'Tạo tài khoản mới' để lưu như một mục riêng biệt.",
  guide_pk_reg_step3_title: "Bước 3: Xác nhận lưu Passkey",
  guide_pk_reg_step3_desc:
    "Sau khi chọn, bấm nút 'Lưu Passkey' để lưu khóa riêng tư đã mã hóa vào két sắt. Extension sẽ tự động đồng bộ lên GitHub Gist nếu bạn đã thiết lập đồng bộ.",

  // Guide Passkey Login Steps
  guide_pk_login_desc:
    "Khi đã lưu trữ Passkey, bạn không cần nhập mật khẩu hay mã 2FA để đăng nhập nữa. Quy trình đăng nhập nhanh chóng chỉ với 2 bước:",
  guide_pk_login_step1_title: "Bước 1: Chọn đăng nhập bằng Passkey",
  guide_pk_login_step1_desc:
    "Tại trang đăng nhập của trang web, chọn hình thức đăng nhập bằng Passkey (hoặc biểu tượng hình chiếc chìa khóa/face ID).",
  guide_pk_login_step2_title: "Bước 2: Xác nhận tài khoản trên popup",
  guide_pk_login_step2_desc:
    "Popup của {APP_NAME} sẽ hiện ra danh sách các tài khoản Passkey đã lưu cho trang web này. Hãy chọn tài khoản tương ứng và bấm 'Xác nhận đăng nhập' để truy cập ngay lập tức.",

  // Guide TOTP Steps
  guide_totp_step1_title: "Bước 1: Quét mã QR 2FA trên trang web",
  guide_totp_step1_desc:
    "Khi trang web (ví dụ: Google, GitHub, Facebook) hiển thị mã QR cấu hình bảo mật 2 lớp, mở {APP_NAME} ra và bấm vào biểu tượng chiếc máy ảnh/quét QR ở góc bên cạnh trường TOTP để quét. Nếu không quét được QR hoặc trang web chỉ cung cấp mã chữ (Secret Key), bạn có thể sao chép đoạn mã đó rồi dán thủ công vào trường TOTP và lưu lại.",
  guide_totp_step2_title: "Bước 2: Tự động lưu và hiển thị mã OTP",
  guide_totp_step2_desc:
    "Sau khi quét, khóa bí mật sẽ tự động được giải mã và lưu lại. {APP_NAME} sẽ bắt đầu sinh mã xác thực 6 chữ số và đếm ngược 30 giây. Bạn chỉ cần click chuột vào mã này để sao chép nhanh và dán vào ô xác thực của website.",

  // Guide FAQ Tab
  guide_faq_subtitle:
    "Giải đáp một số thắc mắc phổ biến về cơ chế đồng bộ, bảo mật và mật khẩu của {APP_NAME}.",
  guide_faq_q1_title: "{login_master_password} của tôi có an toàn không?",
  guide_faq_q1_desc:
    "Cực kỳ an toàn. {APP_NAME} áp dụng cơ chế Zero-Knowledge (Kiến thức bằng Không). {login_master_password} của bạn chỉ dùng để sinh khóa mã hóa cục bộ ngay tại trình duyệt, không bao giờ được lưu lại hay gửi qua Internet.",
  guide_faq_q2_title: "Tôi quên {login_master_password} thì phải làm sao?",
  guide_faq_q2_desc:
    "Không có cách nào khôi phục {login_master_password}. Nếu quên, bạn buộc phải đặt lại extension để bắt đầu lại từ đầu. Hãy ghi nhớ hoặc ghi {login_master_password} ra giấy cất ở nơi an toàn.",
  guide_faq_q3_title: "Tôi có thể đồng bộ mật khẩu trên nhiều máy tính không?",
  guide_faq_q3_desc:
    "Có. Chỉ cần cài đặt {APP_NAME} lên máy tính khác, đăng nhập cùng tài khoản GitHub (hoặc cấu hình cùng mã Token) và điền ĐÚNG {login_master_password} đã dùng ở máy cũ. Dữ liệu sẽ tự động tải về và giải mã mượt mà.",
  guide_faq_q4_title:
    "Két sắt lưu trên GitHub Gist dưới dạng bí mật (Secret Gist) có thực sự riêng tư?",
  guide_faq_q4_desc:
    "Có. Secret Gist không được index bởi các công cụ tìm kiếm và không hiện công khai trên profile GitHub của bạn. Ngay cả khi có ai đó đoán được URL của Gist, họ cũng chỉ nhìn thấy một chuỗi ký tự mã hóa vô nghĩa. Không có {login_master_password}, dữ liệu đó hoàn toàn không thể giải mã.",

  // Welcome View
  welcome_feat_security_title: "Mã hóa Zero-Knowledge",
  welcome_feat_security_desc:
    "Dữ liệu được mã hóa cục bộ bằng {login_master_password} trước khi đồng bộ lên GitHub Gist cá nhân. Tuyệt đối không ai khác có thể đọc được dữ liệu của bạn.",
  welcome_feat_passkeys_title: "Đăng nhập không mật khẩu (Passkey)",
  welcome_feat_passkeys_desc:
    "Đăng ký và xác thực an toàn bằng tiêu chuẩn WebAuthn/Passkey hiện đại, loại bỏ hoàn toàn mật khẩu truyền thống.",
  welcome_feat_totp_title: "Mã xác thực hai lớp (TOTP/2FA)",
  welcome_feat_totp_desc:
    "Lưu trữ và tự động tạo mã OTP 6 số cập nhật liên tục mỗi 30 giây giúp nâng cao bảo mật tài khoản.",
  welcome_security_notice_title: "LƯU Ý BẢO MẬT QUAN TRỌNG",
  welcome_warning_bold:
    "Quên {login_master_password} sẽ làm MẤT DỮ LIỆU VĨNH VIỄN, KHÔNG thể khôi phục.",
  welcome_warning_sub:
    "Chúng tôi không lưu trữ mật khẩu của bạn trên bất kỳ máy chủ nào và nhà cung cấp dịch vụ lưu trữ cũng chỉ thấy dữ liệu két sắt dưới dạng các ký tự mã hóa vô nghĩa. (Lưu ý: Bạn vẫn có thể đổi {login_master_password} trong phần Cài đặt bất cứ lúc nào nếu muốn).",
  welcome_checkbox_label:
    "Tôi đã hiểu rằng nếu quên {login_master_password}, tôi chấp nhận mất toàn bộ dữ liệu vĩnh viễn và không thể khôi phục.",
  welcome_btn_continue: "Bắt đầu thiết lập",
  welcome_btn_next: "Tiếp tục",
  welcome_btn_prev: "Quay lại",

  // URI Match Detection
  match_mode_default: "Mặc định ({mode})",
  match_mode_domain: "Tên miền gốc (Base domain)",
  match_mode_host: "Hostname chính xác (Host)",
  match_mode_starts_with: "Bắt đầu bằng (Starts with)",
  match_mode_exact: "Khớp hoàn toàn (Exact)",
  match_mode_regex: "Biểu thức chính quy (Regex)",
  match_mode_never: "Không bao giờ gợi ý (Never)",
  match_warning_modal_title: "Cảnh báo Bảo mật",
  match_warning_modal_msg:
    "'{mode}' là tùy chọn nâng cao có rủi ro cao làm lộ thông tin đăng nhập nếu cấu hình không đúng cách.",
  match_warning_inline:
    "Cảnh báo: '{mode}' là tùy chọn nâng cao có rủi ro làm lộ thông tin đăng nhập.",
  match_detection_label: "Chế độ khớp tên miền",
  match_detection_desc:
    "Chế độ khớp URI xác định cách {APP_NAME} nhận diện các gợi ý tự động điền.",
  match_mode_header_advanced: "Tùy chọn nâng cao",
  match_warning_learn_more: "Tìm hiểu thêm về khớp tên miền",

  // Tools Page
  select_search_placeholder: "Tìm kiếm...",
  select_no_results: "Không tìm thấy kết quả",
  settings_tools_google_auth: "Công cụ Giải mã Google Authenticator",
  settings_tools_google_auth_sub:
    "Giải mã QR offline export, hiển thị otpauth:// và ghép vào Vault",
  google_tool_paste_label: "Dán chuỗi offline export hoặc tải file ảnh QR:",
  google_tool_btn_parse: "Giải mã & Phân tích",
  google_tool_btn_upload_qr: "Tải file ảnh QR Code",
  import_google_migration_invalid:
    "Mã QR hoặc dữ liệu Google Authenticator không hợp lệ",
  google_migration_subtitle:
    "Phát hiện {count} tài khoản 2FA. Vui lòng chọn thao tác lưu:",
  google_migration_raw_uri: "Raw URI",
  google_migration_action_link: "Ghép vào tài khoản Vault sẵn có",
  google_migration_action_create: "Tạo tài khoản Vault mới",
  google_migration_action_skip: "Bỏ qua không import",
  google_migration_save_batch: "Lưu hàng loạt ({count})",
  google_migration_save_success:
    "Đã import và cập nhật thành công {count} tài khoản 2FA",
};
