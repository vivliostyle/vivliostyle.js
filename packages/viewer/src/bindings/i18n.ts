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
  "zh-Hans": {
    translation: {
      UI_LNG: "zh-Hans",
      TIP_UI_Language: "语言",
      CONFIRM_DELETE: "你确定要删除它吗?",
      CONFIRM_REMOVE: "你确定要移除它吗?",
      CONFIRM_REMOVE_ALL: "你确定要全部移除吗?",
      Input_: "请输入文档URL或HTML代码",
      Book_Mode: "图书模式",
      Render_All_Pages: "渲染所有页面",
      Apply: "应用",
      Supported_document_types_: "支持的文档类型:",
      HTML_documents_: "带有分页媒体的css HTML 文档",
      Book_like_publications_: "类似书籍的出版物,带有目录",
      Web_publications_:
        "Web出版物(一组HTML文档集合): 指定第一个HTML或声明文件的URL。",
      Unzipped_EPUB_:
        "解压缩EPUB:指定OPF文件的URL或解压缩后EPUB文件的顶级目录。",
      Notes_: "注意:",
      GitHub_:
        "可以直接指定GitHub和Gist网址。当指定了此类网址时,Vivliostyle会加载原始GitHub/Gist的内容。",
      WARN_Mixed_Content_:
        "⚠️混合内容(如果“http:”的URL被指定为“https:”的Vivliostyle Viewer)通常会被浏览器屏蔽。",
      WARN_Cross_Origin_:
        "⚠️除非服务器设置为允许跨域请求(CORS)，否则对不同域的请求通常会被浏览器阻止。",
      URL_parameter_options_: "URL 参数选项:",
      document_URL: "文档 URL",
      default_: "(默认)",
      for_Book_like_: "用于类似图书出版物",
      DESC_Book_Mode_:
        "当指定一个HTML文档URL, 来自出版物清单或者目录(例如, 带有 '<nav role=\"doc-toc\">'标记)一系列的html文档链接会自动被加载。",
      for_single_HTML_: "用户单个 HTML 文档",
      for_Print_: "为了打印（所有页面均可被打印，页数计算也是正常的）",
      for_Read_: "为了阅读（快速加载粗略页数计算）",
      Page_Spread_View: "页面视图对页",
      Spread_view: "对页视图",
      Single_page_view: "单页视图",
      Auto_spread_view: "自动对页",
      additional_stylesheet_URL: "附加 (自定义) 样式表 URL",
      user_stylesheet_URL: "用户样式表 URL",
      Settings: "设置",
      DESC_Options_also_1: "选项也可在",
      DESC_Options_also_2: "面板设置。",
      See_documentation_: "有关更多详细信息，请参阅文档:",
      HREF_User_Guide: "../docs/#/user-guide",
      Vivliostyle_User_Guide: "Vivliostyle 用户指南",
      HREF_Vivlistyle_Home: "https://vivliostyle.org/",
      navigate_to_left: "向左导航",
      navigate_to_right: "向右导航",
      Highlight_: "高亮…",
      Marker_Yellow: "标记: 黄",
      Marker_Red: "标记: 红",
      Marker_Green: "标记: 绿",
      OK: "确认",
      Cancel: "取消",
      Delete: "删除",
      TIP_Settings: "设置 (S),双击/双敲击键以固定",
      Page_View_Mode: "界面视图模式",
      Auto: "自动",
      Single_page: "单页",
      Spread: "对页",
      TIP_Book_Mode: "On: 为了类似图书出版物带有目录\nOff: 为了单 HTML 文档",
      TIP_Render_All_Pages:
        "On: 为了打印(所有页面可打印, 页面计数正常工作)\nOff: 为了阅读 (快速加载粗略计数)",
      Restore_View: "恢复阅览状态",
      TIP_Restore_View: "重新打开文档时恢复视图设置",
      Custom_Style_Settings: "自定义样式设置",
      Page_Size: "页面大小",
      Default: "默认",
      DESC_page_size_default: "(=自动 除非另外设置)",
      DESC_page_size_auto: "(使用整个窗口面积)",
      Preset: "预设",
      Landscape: "横向",
      Custom_size: "自定义尺寸",
      Width: "宽度",
      Height: "高度",
      More_: "详细...",
      Crop_Marks: "裁剪标记",
      Crop_marks: "裁剪标记",
      Bleed: "出血",
      Crop_offset: "裁剪偏移",
      Page_Margins: "页面边距",
      DESC_page_margin_default: "(=10% 除非另外设置)",
      Set_page_margin_to_0: "设置页面边距为 0",
      Custom_margin: "自定义边距",
      Top_Right_Bottom_Left: "顶部/右侧/底部/左侧",
      Set_first_page_margin_to_0: "设置第一页的边距为 0",
      Force_html_body_margin_to_0: "强制 html/body 边距为 0",
      Page_Breaks: "分页",
      Default_widows_orphans_control: "默认 widows/orphans 控制",
      Allow_widows_and_orphans: "允许产生widows 和 orphans",
      Avoid_page_break_inside_paragraph: "避免段落内出现分页",
      Images: "图片",
      Set_image_max_size_to_fit_page: "图像最大尺寸设置为适合页面",
      Keep_aspect_ratio: "保持长宽比",
      Text: "文本",
      Font_size: "字体大小",
      Base_font_size: "基础 字号",
      Base_line_height: "基础 行高",
      Base_font_family: "基础 字体",
      Custom_Style_Priority: "自定义 Style 属性",
      Set_as_user_stylesheet: "设置为用户样式表",
      DESC_user_stylesheet: "(低优先级除非 !important)",
      Force_override_document_style: "强制覆盖document的样式",
      important_: "(!important)",
      Edit_CSS: "编辑 CSS",
      Dont_edit_: "不要在 /*<viewer>*/ 和 /*</viewer>*/之间进行编辑",
      Reset_Custom_Style: "重置自定义样式",
      Reset_all_to_default: "重置所有",
      TIP_ToC: "目录 (T), 双击/双敲击键以固定",
      TIP_Marker: "标记 (M), 双击/双敲击键以固定",
      Marks_and_Memos: "标记和备忘录",
      Remove_All: "移除所有",
      Remove: "移除",
      Memo: "备忘录",
      TIP_Find: "查找 (Ctrl/Cmd+F)",
      TIP_Find_Previous: "查找上一个 (Shift+Enter)",
      TIP_Find_Next: "查找下一个 (Enter)",
      Find: "查找",
      TIP_First_Page: "首页 (Home)",
      TIP_Previous_Page: "上一页 (↑)",
      TIP_Next_Page: "下一页 (↓)",
      TIP_Last_Page: "最后一页(End)",
      TIP_Go_to_Page: "跳转到… (G)",
      Total_pages: "总页数",
      TIP_Text_Smaller: "文本: 小 (-)",
      TIP_Text_Larger: "文本: 大 (+)",
      TIP_Text_Default_Size: "文本: 默认尺寸 (0)",
      TIP_Zoom_Out: "缩小 (O)",
      TIP_Zoom_In: "放大 (I)",
      TIP_Zoom_Actual_Size: "缩放: 实际大小 (1)",
      TIP_Zoom_Fit_to_Screen: "缩放: 适应屏幕 (F)",
      TIP_Print: "打印 (P)",
    },
  },
  "zh-Hant": {
    translation: {
      UI_LNG: "zh-Hant",
      TIP_UI_Language: "語言",
      CONFIRM_DELETE: "你確定要刪除它嗎?",
      CONFIRM_REMOVE: "你確定要移除它嗎?",
      CONFIRM_REMOVE_ALL: "你確定要全部移除嗎?",
      Input_: "請輸入文檔URL或HTML代碼",
      Book_Mode: "圖書模式",
      Render_All_Pages: "渲染所有頁面",
      Apply: "應用",
      Supported_document_types_: "支持的文檔類型:",
      HTML_documents_: "帶有分頁媒體的css HTML 文檔",
      Book_like_publications_: "類似書籍的出版物,帶有目錄",
      Web_publications_:
        "Web出版物(一組HTML文檔集合): 指定第一個HTML或聲明文件的URL。",
      Unzipped_EPUB_:
        "解壓縮EPUB:指定OPF文件的URL或解壓縮後EPUB文件的頂級目錄。",
      Notes_: "注意:",
      GitHub_:
        "可以直接指定GitHub和Gist網址。當指定了此類網址時,Vivliostyle會加載原始GitHub/Gist的內容。",
      WARN_Mixed_Content_:
        "⚠️混合內容(如果“http:”的URL被指定爲“https:”的Vivliostyle Viewer)通常會被瀏覽器屏蔽。",
      WARN_Cross_Origin_:
        "⚠️除非服務器設置爲允許跨域請求(CORS)，否則對不同域的請求通常會被瀏覽器阻止。",
      URL_parameter_options_: "URL 參數選項:",
      document_URL: "文檔 URL",
      default_: "(默認)",
      for_Book_like_: "用於類似圖書出版物",
      DESC_Book_Mode_:
        "當指定一個HTML文檔URL, 來自出版物清單或者目錄(例如, 帶有 '<nav role=\"doc-toc\">'標記)一系列的html文檔鏈接會自動被加載。",
      for_single_HTML_: "用戶單個 HTML 文檔",
      for_Print_: "爲了打印（所有頁面均可被打印，頁數計算也是正常的）",
      for_Read_: "爲了閱讀（快速加載粗略頁數計算）",
      Page_Spread_View: "頁面視圖對頁",
      Spread_view: "對頁視圖",
      Single_page_view: "單頁視圖",
      Auto_spread_view: "自動對頁",
      additional_stylesheet_URL: "附加 (自定義) 樣式表 URL",
      user_stylesheet_URL: "用戶樣式表 URL",
      Settings: "設置",
      DESC_Options_also_1: "選項也可在",
      DESC_Options_also_2: "面板設置。",
      See_documentation_: "有關更多詳細信息，請參閱文檔:",
      HREF_User_Guide: "../docs/#/user-guide",
      Vivliostyle_User_Guide: "Vivliostyle 用戶指南",
      HREF_Vivlistyle_Home: "https://vivliostyle.org/",
      navigate_to_left: "向左導航",
      navigate_to_right: "向右導航",
      Highlight_: "高亮…",
      Marker_Yellow: "標記: 黃",
      Marker_Red: "標記: 紅",
      Marker_Green: "標記: 綠",
      OK: "確認",
      Cancel: "取消",
      Delete: "刪除",
      TIP_Settings: "設置 (S),雙擊/雙敲擊鍵以固定",
      Page_View_Mode: "界面視圖模式",
      Auto: "自動",
      Single_page: "單頁",
      Spread: "對頁",
      TIP_Book_Mode: "On: 爲了類似圖書出版物帶有目錄\nOff: 爲了單 HTML 文檔",
      TIP_Render_All_Pages:
        "On: 爲了打印(所有頁面可打印, 頁面計數正常工作)\nOff: 爲了閱讀 (快速加載粗略計數)",
      Restore_View: "恢復閱覽狀態",
      TIP_Restore_View: "重新打開文檔時恢復視圖設置",
      Custom_Style_Settings: "自定義樣式設置",
      Page_Size: "頁面大小",
      Default: "默認",
      DESC_page_size_default: "(=自動 除非另外設置)",
      DESC_page_size_auto: "(使用整個窗口面積)",
      Preset: "預設",
      Landscape: "橫向",
      Custom_size: "自定義尺寸",
      Width: "寬度",
      Height: "高度",
      More_: "詳細...",
      Crop_Marks: "裁剪標記",
      Crop_marks: "裁剪標記",
      Bleed: "出血",
      Crop_offset: "裁剪偏移",
      Page_Margins: "頁面邊距",
      DESC_page_margin_default: "(=10% 除非另外設置)",
      Set_page_margin_to_0: "設置頁面邊距爲 0",
      Custom_margin: "自定義邊距",
      Top_Right_Bottom_Left: "頂部/右側/底部/左側",
      Set_first_page_margin_to_0: "設置第一頁的邊距爲 0",
      Force_html_body_margin_to_0: "強制 html/body 邊距爲 0",
      Page_Breaks: "分頁",
      Default_widows_orphans_control: "默認 widows/orphans 控制",
      Allow_widows_and_orphans: "允許產生widows 和 orphans",
      Avoid_page_break_inside_paragraph: "避免段落內出現分頁",
      Images: "圖片",
      Set_image_max_size_to_fit_page: "圖像最大尺寸設置爲適合頁面",
      Keep_aspect_ratio: "保持長寬比",
      Text: "文本",
      Font_size: "字體大小",
      Base_font_size: "基礎 字號",
      Base_line_height: "基礎 行高",
      Base_font_family: "基礎 字體",
      Custom_Style_Priority: "自定義 Style 屬性",
      Set_as_user_stylesheet: "設置爲用戶樣式表",
      DESC_user_stylesheet: "(低優先級除非 !important)",
      Force_override_document_style: "強制覆蓋document的樣式",
      important_: "(!important)",
      Edit_CSS: "編輯 CSS",
      Dont_edit_: "不要在 /*<viewer>*/ 和 /*</viewer>*/之間進行編輯",
      Reset_Custom_Style: "重置自定義樣式",
      Reset_all_to_default: "重置所有",
      TIP_ToC: "目錄 (T), 雙擊/雙敲擊鍵以固定",
      TIP_Marker: "標記 (M), 雙擊/雙敲擊鍵以固定",
      Marks_and_Memos: "標記和備忘錄",
      Remove_All: "移除所有",
      Remove: "移除",
      Memo: "備忘錄",
      TIP_Find: "查找 (Ctrl/Cmd+F)",
      TIP_Find_Previous: "查找上一個 (Shift+Enter)",
      TIP_Find_Next: "查找下一個 (Enter)",
      Find: "查找",
      TIP_First_Page: "首頁 (Home)",
      TIP_Previous_Page: "上一頁 (↑)",
      TIP_Next_Page: "下一頁 (↓)",
      TIP_Last_Page: "最後一頁(End)",
      TIP_Go_to_Page: "跳轉到… (G)",
      Total_pages: "總頁數",
      TIP_Text_Smaller: "文本: 小 (-)",
      TIP_Text_Larger: "文本: 大 (+)",
      TIP_Text_Default_Size: "文本: 默認尺寸 (0)",
      TIP_Zoom_Out: "縮小 (O)",
      TIP_Zoom_In: "放大 (I)",
      TIP_Zoom_Actual_Size: "縮放: 實際大小 (1)",
      TIP_Zoom_Fit_to_Screen: "縮放: 適應屏幕 (F)",
      TIP_Print: "打印 (P)",
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
      if (/^(zh(-cmn)?|cmn)-(TW|HK|Hant)\b/i.test(lng)) {
        // "zh-TW", "zh-HK", "zh-Hant", "cmn-Hant" etc. -> "zh-Hant"
        lng = "zh-Hant";
      } else if (/^(zh|cmn)\b/i.test(lng)) {
        // "zh", "zh-CN", "zh-Hans", "cmn-Hans" etc. -> "zh-Hans"
        lng = "zh-Hans";
      } else {
        // "en-US" -> "en"
        lng = lng.toLowerCase().replace(/-.*/, "");
      }
      if (lng in translations) {
        return lng;
      }
    }
  } catch (_e) {
    // ignore
  }
  // fallback
  return "en";
}

i18nextko.init(translations, detectLanguage(), ko);
