/*
 * Copyright 2023 Vivliostyle Foundation
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 */

import i18nextko from "i18next-ko";
import ko from "knockout";

const translations = {
  en: {
    translation: {
      UI_LNG: "en",
      TIP_UI_Language: "Language of UI",
      CONFIRM_DELETE: "Do you really want to delete it?",
      CONFIRM_REMOVE: "Do you really want to remove it?",
      CONFIRM_REMOVE_ALL: "Do you really want to remove all?",
      Input_: "Input a document URL or HTML code",
      Book_Mode: "Book Mode",
      Render_All_Pages: "Render All Pages",
      Apply: "Apply",
      Supported_document_types_: "Supported document types:",
      HTML_documents_: "HTML documents, with CSS for paged media",
      Book_like_publications_: "Book-like publications, with Table of Contents",
      Web_publications_:
        "Web publications (a collection of HTML documents): specify URL of the first HTML or the manifest file.",
      Unzipped_EPUB_:
        "Unzipped EPUB: specify URL of OPF file or top directory of the unzipped EPUB files.",
      Notes_: "Notes:",
      GitHub_:
        "GitHub and Gist URLs can be directly specified. Vivliostyle loads raw github/gist content when such URL is specified.",
      WARN_Mixed_Content_:
        "⚠️Mixed Content (“http:” URL is specified to “https:” Vivliostyle Viewer) is usually blocked by browser.",
      WARN_Cross_Origin_:
        "⚠️Cross-Origin (request to different domain) is usually blocked by browser unless the server is configured to allow Cross-Origin Resource Sharing (CORS).",
      URL_parameter_options_: "URL parameter options:",
      document_URL: "document URL",
      default_: "(default)",
      for_Book_like_: "for Book-like publications",
      DESC_Book_Mode_:
        "When an HTML document URL is specified, a series of HTML documents linked from the publication manifest or Table of Contents (e.g., marked up with '<nav role=\"doc-toc\">') are automatically loaded.",
      for_single_HTML_: "for single HTML documents",
      for_Print_:
        "for Print (all pages printable, page count works as expected)",
      for_Read_: "for Read (quick loading with rough page count)",
      Page_Spread_View: "Page Spread View",
      Spread_view: "Spread view",
      Single_page_view: "Single page view",
      Auto_spread_view: "Auto spread view",
      additional_stylesheet_URL: "additional (custom) stylesheet URL",
      user_stylesheet_URL: "user stylesheet URL",
      Settings: "Settings",
      DESC_Options_also_1: "Options can also be set in the ",
      DESC_Options_also_2: " panel.",
      See_documentation_: "For more details, see documentation:",
      HREF_User_Guide: "../docs/#/user-guide",
      Vivliostyle_User_Guide: "Vivliostyle User Guide",
      HREF_Vivlistyle_Home: "https://vivliostyle.org/",
      navigate_to_left: "navigate to left",
      navigate_to_right: "navigate to right",
      Highlight_: "Highlight…",
      Marker_Yellow: "Marker: Yellow",
      Marker_Red: "Marker: Red",
      Marker_Green: "Marker: Green",
      OK: "OK",
      Cancel: "Cancel",
      Delete: "Delete",
      TIP_Settings: "Settings (S), Double click/type to pin",
      Page_View_Mode: "Page View Mode",
      Auto: "Auto",
      Single_page: "Single page",
      Spread: "Spread",
      TIP_Book_Mode:
        "On: for Book-like publications, with Table of Contents\nOff: for single HTML documents",
      TIP_Render_All_Pages:
        "On: for Print (all pages printable, page count works)\nOff: for Read (quick loading with rough page count)",
      Restore_View: "Restore View",
      TIP_Restore_View: "Restore view settings when reopening documents",
      Custom_Style_Settings: "Custom Style Settings",
      Page_Size: "Page Size",
      Default: "Default",
      DESC_page_size_default: "(=Auto unless specified elsewhere)",
      DESC_page_size_auto: "(use entire window area)",
      Preset: "Preset",
      Landscape: "Landscape",
      Custom_size: "Custom size",
      Width: "Width",
      Height: "Height",
      More_: "More…",
      Crop_Marks: "Crop Marks",
      Crop_marks: "Crop marks",
      Bleed: "Bleed",
      Crop_offset: "Crop offset",
      Page_Margins: "Page Margins",
      DESC_page_margin_default: "(=10% unless specified elsewhere)",
      Set_page_margin_to_0: "Set page margin to 0",
      Custom_margin: "Custom margin",
      Top_Right_Bottom_Left: "Top/Right/Bottom/Left",
      Set_first_page_margin_to_0: "Set first page margin to 0",
      Force_html_body_margin_to_0: "Force html/body margin to 0",
      Page_Breaks: "Page Breaks",
      Default_widows_orphans_control: "Default widows/orphans control",
      Allow_widows_and_orphans: "Allow widows and orphans",
      Avoid_page_break_inside_paragraph: "Avoid page break inside paragraph",
      Images: "Images",
      Set_image_max_size_to_fit_page: "Set image max-size to fit page",
      Keep_aspect_ratio: "Keep aspect ratio",
      Text: "Text",
      Font_size: "Font size",
      Base_font_size: "Base font-size",
      Base_line_height: "Base line-height",
      Base_font_family: "Base font-family",
      Custom_Style_Priority: "Custom Style Priority",
      Set_as_user_stylesheet: "Set as user stylesheet",
      DESC_user_stylesheet: "(lower priority unless !important)",
      Force_override_document_style: "Force override document style",
      important_: "(!important)",
      Edit_CSS: "Edit CSS",
      Dont_edit_: "Don't edit between /*<viewer>*/ and /*</viewer>*/.",
      Reset_Custom_Style: "Reset Custom Style",
      Reset_all_to_default: "Reset all to default",
      TIP_ToC: "Table of Contents (T), Double click/type to pin",
      TIP_Marker: "Marker (M), Double click/type to pin",
      Marks_and_Memos: "Marks and Memos",
      Remove_All: "Remove All",
      Remove: "Remove",
      Memo: "Memo",
      TIP_Find: "Find (Ctrl/Cmd+F)",
      TIP_Find_Previous: "Find Previous (Shift+Enter)",
      TIP_Find_Next: "Find Next (Enter)",
      Find: "Find",
      TIP_First_Page: "First Page (Home)",
      TIP_Previous_Page: "Previous Page (↑)",
      TIP_Next_Page: "Next Page (↓)",
      TIP_Last_Page: "Last Page (End)",
      TIP_Go_to_Page: "Go to Page… (G)",
      Total_pages: "Total pages",
      TIP_Text_Smaller: "Text: Smaller (-)",
      TIP_Text_Larger: "Text: Larger (+)",
      TIP_Text_Default_Size: "Text: Default Size (0)",
      TIP_Zoom_Out: "Zoom: Out (O)",
      TIP_Zoom_In: "Zoom: In (I)",
      TIP_Zoom_Actual_Size: "Zoom: Actual Size (1)",
      TIP_Zoom_Fit_to_Screen: "Zoom: Fit to Screen (F)",
      TIP_Print: "Print (P)",
    },
  },
  ja: {
    translation: {
      UI_LNG: "ja",
      TIP_UI_Language: "UI表示言語 (L)",
      CONFIRM_DELETE: "本当に削除しますか？",
      CONFIRM_REMOVE: "本当に削除しますか？",
      CONFIRM_REMOVE_ALL: "本当にすべて削除しますか？",
      Input_: "ドキュメントURLまたはHTMLコードを入力",
      Book_Mode: "Bookモード",
      Render_All_Pages: "全ページ組版",
      Apply: "適用",
      Supported_document_types_: "サポートされている文書の種類：",
      HTML_documents_: "HTML文書＋ページメディア用のCSS",
      Book_like_publications_: "本のような出版物（目次付き）",
      Web_publications_:
        "Web出版物（複数のHTML文書からなるコレクション）: 最初のHTMLまたはマニフェストファイルのURLを指定します。",
      Unzipped_EPUB_:
        "ZIP解凍済みのEPUB: OPFファイルのURLまたは解凍されたEPUBファイルのトップディレクトリを指定します。",
      Notes_: "メモ：",
      GitHub_:
        "GitHubとGistのURLを直接指定することができます。そのようなURLが指定された場合、Vivliostyle は github/gist の raw コンテンツをロードします。",
      WARN_Mixed_Content_:
        "⚠️Mixedコンテンツ（“http:” のURLが “https:” の Vivliostyle Viewer に指定された場合）は通常ブラウザによってブロックされます。",
      WARN_Cross_Origin_:
        "⚠️Cross-Origin（異なるドメインへのリクエスト）は、サーバーが Cross-Origin Resource Sharing (CORS) を許可するように設定されていない限り、通常はブラウザによってブロックされます。",
      URL_parameter_options_: "URLパラメータのオプション：",
      document_URL: "ドキュメントURL",
      default_: "(デフォルト)",
      for_Book_like_: "本のような出版物（目次付き）用",
      DESC_Book_Mode_:
        "HTML文書のURLが指定された場合、その出版物マニフェストまたは目次（'<nav role=\"doc-toc\">' などでマークアップ）からリンクされた一連のHTML文書が自動的に読み込まれます。",
      for_single_HTML_: "単体のHTML文書用",
      for_Print_:
        "印刷用（すべてのページが印刷可能で、ページ番号は期待されるとおりに機能します）",
      for_Read_: "閲覧用（おおまかなページ番号を使って、クイックロード）",
      Page_Spread_View: "ページ見開き表示",
      Spread_view: "見開き表示",
      Single_page_view: "単ページ表示",
      Auto_spread_view: "自動見開き表示",
      additional_stylesheet_URL: "追加（カスタム）スタイルシートURL",
      user_stylesheet_URL: "ユーザースタイルシートURL",
      Settings: "設定",
      DESC_Options_also_1: "オプションは設定パネル（",
      DESC_Options_also_2: "）でも設定できます。",
      See_documentation_: "詳しくは、Vivliostyleのドキュメントをご覧ください：",
      HREF_User_Guide: "../docs/#/ja/user-guide",
      Vivliostyle_User_Guide: "Vivliostyle ユーザーガイド",
      HREF_Vivlistyle_Home: "https://vivliostyle.org/ja/",
      navigate_to_left: "左にページ移動",
      navigate_to_right: "右にページ移動",
      Highlight_: "ハイライト…",
      Marker_Yellow: "マーカー: 黄",
      Marker_Red: "マーカー: 赤",
      Marker_Green: "マーカー: 緑",
      OK: "OK",
      Cancel: "キャンセル",
      Delete: "削除",
      TIP_Settings: "設定 (S), ダブルクリックで固定",
      Page_View_Mode: "ページ表示モード (P)",
      Auto: "自動",
      Single_page: "単ページ",
      Spread: "見開き",
      TIP_Book_Mode:
        "ON: 本のような出版物（目次付き）用\nOFF: 単体のHTML文書用",
      TIP_Render_All_Pages:
        "ON: 印刷用（すべてのページが印刷可能で、ページ番号は期待されるとおりに機能します）\nOFF: 閲覧用（おおまかなページ番号を使って、クイックロード）",
      Restore_View: "閲覧状態を復元",
      TIP_Restore_View: "文書を開き直すとき閲覧状態を復元",
      Custom_Style_Settings: "カスタムスタイル設定 (C)",
      Page_Size: "ページサイズ",
      Default: "デフォルト",
      DESC_page_size_default: "(=自動、特に指定のない限り)",
      DESC_page_size_auto: "(ウィンドウの全領域を使用)",
      Preset: "プリセット",
      Landscape: "ランドスケープ",
      Custom_size: "カスタムサイズ",
      Width: "幅",
      Height: "高さ",
      More_: "詳細… (M)",
      Crop_Marks: "トンボ設定",
      Crop_marks: "Crop marks",
      Bleed: "Bleed",
      Crop_offset: "Crop offset",
      Page_Margins: "ページマージン",
      DESC_page_margin_default: "(=10%、特に指定のない限り)",
      Set_page_margin_to_0: "ページのマージンを0にする",
      Custom_margin: "カスタムマージン",
      Top_Right_Bottom_Left: "上/右/下/左",
      Set_first_page_margin_to_0: "先頭ページのマージンを0にする",
      Force_html_body_margin_to_0: "html/bodyのマージンを強制的に0にする",
      Page_Breaks: "ページ分割処理",
      Default_widows_orphans_control: "デフォルトのwidows/orphansの制御",
      Allow_widows_and_orphans: "widow/orphanが生じるのを許容",
      Avoid_page_break_inside_paragraph: "段落内で改ページしないようにする",
      Images: "画像",
      Set_image_max_size_to_fit_page: "画像の最大サイズをページに収める",
      Keep_aspect_ratio: "アスペクト比を維持",
      Text: "テキスト",
      Font_size: "文字サイズ",
      Base_font_size: "基本の font-size",
      Base_line_height: "基本の line-height",
      Base_font_family: "基本の font-family",
      Custom_Style_Priority: "カスタムスタイルの優先度",
      Set_as_user_stylesheet: "ユーザースタイルシート扱いにする",
      DESC_user_stylesheet: "(!important の指定がない限り低い優先度)",
      Force_override_document_style: "ドキュメントのスタイルを強制的に上書き",
      important_: "(!important)",
      Edit_CSS: "CSSを編集 (E)",
      Dont_edit_: "/*<viewer>*/ と /*</viewer>*/ の間は編集しないこと",
      Reset_Custom_Style: "カスタムスタイルをリセット (R)",
      Reset_all_to_default: "すべてをデフォルトにリセット",
      TIP_ToC: "目次 (T), ダブルクリックで固定",
      TIP_Marker: "マーカー (M), ダブルクリックで固定",
      Marks_and_Memos: "マーカーとメモ",
      Remove_All: "すべて削除",
      Remove: "削除",
      Memo: "メモ",
      TIP_Find: "検索 (Ctrl/Cmd+F)",
      TIP_Find_Previous: "前を検索 (Shift+Enter)",
      TIP_Find_Next: "次を検索 (Enter)",
      Find: "検索",
      TIP_First_Page: "最初のページ (Home)",
      TIP_Previous_Page: "前のページ (↑)",
      TIP_Next_Page: "次のページ (↓)",
      TIP_Last_Page: "最後のページ (End)",
      TIP_Go_to_Page: "ページ番号… (G)",
      Total_pages: "総ページ数",
      TIP_Text_Smaller: "文字を小さく (-)",
      TIP_Text_Larger: "文字を大きく (+)",
      TIP_Text_Default_Size: "デフォルトの文字サイズ (0)",
      TIP_Zoom_Out: "縮小 (O)",
      TIP_Zoom_In: "拡大 (I)",
      TIP_Zoom_Actual_Size: "実際のサイズ (1)",
      TIP_Zoom_Fit_to_Screen: "画面に合わせる (F)",
      TIP_Print: "印刷 (P)",
    },
  },
};

/**
 * simple language detector alternative to i18next-browser-languageDetector
 * @returns {string} language code
 */
function detectLanguage(): string {
  try {
    // Detect from URL parameter: "?lng=xx", "&lng=xx" or "#lng=xx"
    let lng = /[?&#]lng=([^?&#]+)/.exec(window.location.href)?.[1];
    if (!lng) {
      // Detect from localStorage
      lng = window.localStorage.getItem("i18nextLng");
      if (!lng) {
        // Detect from browser
        lng = navigator.language;
      }
    }
    if (lng) {
      // "en-US" -> "en"
      // FIXME: need fix for "zh-CN", "zh-TW", or "zh-Hant-HK" etc. when we support them
      lng = lng.toLowerCase().replace(/-.*/, "");
      if (lng in translations) {
        return lng;
      }
    }
  } catch (e) {
    // ignore
  }
  // fallback
  return "en";
}

i18nextko.init(translations, detectLanguage(), ko);
