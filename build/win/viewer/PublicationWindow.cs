using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text.RegularExpressions;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using AdaptServiceWrapper;

namespace Viewer
{
    public partial class PublicationWindow : Form
    {
        AdaptService service;
        string initCommand;
        Dictionary<string, object> metadata;
        string file;
        bool selfContained;
        bool zipped;

        public PublicationWindow()
        {
            InitializeComponent();
        }

        private bool Open(string file, bool selfContained, bool zipped)
        {
            if (service != null)
            {
                service.Close();
                service = null;
            }
            this.file = file;
            this.selfContained = selfContained;
            this.zipped = zipped;
            service = new AdaptService();
            if (selfContained)
            {
                if (!service.OpenContainer(file, zipped, ProcessMessageAsync))
                {
                    return false;
                }
            }
            else
            {
                if (!service.OpenPath(file, ProcessMessageAsync))
                {
                    return false;
                }
            }
            String url = service.GetBootstrapURL();
            String init = service.GetInitCall("main", "\"autoresize\":true");
            Console.Out.Write("URL:" + url + "  Command:" + init + "\n");
            initCommand = init;
            view.DocumentCompleted += new WebBrowserDocumentCompletedEventHandler(ScriptLoaded);
            view.Navigate(url);
            return true;
        }

        private void ScriptLoaded(object sender, WebBrowserDocumentCompletedEventArgs e)
        {
            Regex r = new Regex(@"\s*(\w+)\s*\('([^']*)'\s*,\s*'([^']*)'\s*,\s*([^)]*)\)\s*");
            Match m = r.Match(initCommand);
            if (m.Success)
            {
                view.Document.InvokeScript(m.Groups[1].Value, 
                    new object[] { m.Groups[2].Value, m.Groups[3].Value, m.Groups[4].Value });
            }
        }

        private void SendCommand(string command)
        {
            view.Document.InvokeScript("adapt_command", new string[] { command });
        }

        private void ProcessMessageAsync(String message)
        {
            Invoke((MessageHandler)this.ProcessMessageSync, new object[] { message });
        }

        private void ProcessMessageSync(String message)
        {
            Console.Out.Write("Got message:" + message + "\n");
            JavaScriptSerializer ser = new JavaScriptSerializer();
            Dictionary<string,object> jsonMessage = (Dictionary<string,object>)ser.DeserializeObject(message);
            if (jsonMessage.ContainsKey("t"))
            {
                object type = jsonMessage["t"];
                if (type.Equals("loaded"))
                {
                    if (jsonMessage.ContainsKey("metadata"))
                    {
                        object metadata = jsonMessage["metadata"];
                        if (metadata is Dictionary<string,object>)
                        {
                            this.metadata = (Dictionary<string, object>)metadata;
                            UpdateTitle();
                        }
                    }
                }
                else if (type.Equals("nav"))
                {

                }
                else if (type.Equals("hyperlink"))
                {
                    if (jsonMessage.ContainsKey("internal") && jsonMessage.ContainsKey("href"))
                    {
                        if (jsonMessage["internal"].Equals(true))
                        {
                            NavigateTo(jsonMessage["href"].ToString());
                        }
                    }
                }
            }
        }

        private void UpdateTitle()
        {
            string titleTerm = "http://purl.org/dc/terms/title";
            if (metadata.ContainsKey(titleTerm))
            {
                object titleList = metadata[titleTerm];
                if (titleList is Array)
                {
                    object[] titles = (object[])titleList;
                    if (titles.Length > 0 && titles[0] is Dictionary<string, object>)
                    {
                        Dictionary<string, object> titleDict = (Dictionary<string, object>)(titles[0]);
                        if (titleDict.ContainsKey("v"))
                        {
                            object title = titleDict["v"];
                            if (title is string)
                            {
                                Text = (string)title;
                            }
                        }
                    }
                }
            }
        }

        protected void FileOpen_Click(object sender, System.EventArgs e)
        {
            OpenFileDialog openDialog = new OpenFileDialog();
            openDialog.Title = "Open Publication";
            openDialog.Filter = "EPUB files|*.epub|XHTML files|*.xhtml|OPF files|*.opf|FB2 files|*.fb2|FB2 compressed files|*.fb2.zip";
           // theDialog.InitialDirectory = @"C:\";
            if (openDialog.ShowDialog() != DialogResult.OK)
            {
                return;
            }
            string file = openDialog.FileName;
            bool unpackaged = file.EndsWith(".opf") || file.EndsWith(".xhtml");
            bool not_zipped = file.EndsWith(".fb2");
            Open(file, !unpackaged, !not_zipped);
        }

        private void FileExit_Click(object sender, EventArgs e)
        {
            Dispose();
        }

        private void AppWindow_Load(object sender, EventArgs e)
        {
            //Icon icon = new Icon("resources/magazine.ico");
            //this.Icon = icon;
        }

        private void ToggleTOC_Click(object sender, EventArgs e)
        {
            ToggleTOC();
        }

        private void NextPage_Click(object sender, EventArgs e)
        {
            NextPage();
        }

        private void FirstPage_Click(object sender, EventArgs e)
        {
            FirstPage();
        }
        private void PreviousPage_Click(object sender, EventArgs e)
        {
            PreviousPage();
        }
        private void LastPage_Click(object sender, EventArgs e)
        {
            LastPage();
        }
        private void Reload_Click(object sender, EventArgs e)
        {
            Reload();
        }

        protected void GoNextPage_Click(object sender, System.EventArgs e)
        {
            NextPage();
        }

        protected void GoPreviousPage_Click(object sender, System.EventArgs e)
        {
            PreviousPage();
        }

        protected void GoFirstPage_Click(object sender, System.EventArgs e)
        {
            FirstPage();
        }

        protected void GoLastPage_Click(object sender, System.EventArgs e)
        {
            LastPage();
        }

        private void GoReload_Click(object sender, EventArgs e)
        {
            Reload();
        }


        // ------------------- Actions -----------------------------

        public void NavigateTo(string url)
        {
            SendCommand("{\"a\":\"moveTo\",\"url\":\"" + url + "\"}");
        }

        public void ToggleTOC()
        {
            SendCommand("{\"a\":\"toc\",\"v\":\"toggle\",\"autohide\":true}");
        }

        public void Reload()
        {
            if (service != null)
            {
                service.Close();
                initCommand = null;
            }
            Open(file, selfContained, zipped);
        }

        public void NextPage()
        {
            SendCommand("{\"a\":\"moveTo\",\"where\":\"next\"}");
        }

        public void PreviousPage()
        {
            SendCommand("{\"a\":\"moveTo\",\"where\":\"previous\"}");
        }

        public void FirstPage()
        {
            SendCommand("{\"a\":\"moveTo\",\"where\":\"first\"}");
        }

        public void LastPage()
        {
            SendCommand("{\"a\":\"moveTo\",\"where\":\"last\"}");
        }

        //-------------------------------------------------------------

        protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
        {
            if (keyData == Keys.Home)
            {
                SendCommand("{\"a\":\"moveTo\",\"where\":\"first\"}");
                return true;
            }
            if (keyData == Keys.End)
            {
                SendCommand("{\"a\":\"moveTo\",\"where\":\"last\"}");
                return true;
            }
            if (keyData == Keys.Right || keyData == Keys.PageDown)
            {
                SendCommand("{\"a\":\"moveTo\",\"where\":\"next\"}");
                return true;
            }
            if (keyData == Keys.Left || keyData == Keys.PageUp)
            {
                SendCommand("{\"a\":\"moveTo\",\"where\":\"previous\"}");
                return true;
            }
            return base.ProcessCmdKey(ref msg, keyData);
        }

        private void PublicationWindow_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (service != null)
            {
                service.Close();
                service = null;
                initCommand = null;
            }
        }
    }
}
