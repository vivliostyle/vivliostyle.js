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

        public PublicationWindow()
        {
            InitializeComponent();
        }

        public bool Open(string file)
        {
            service = new AdaptService();
            if (!service.Open(file, ProcessMessageAsync))
            {
                return false;
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
                        }
                    }
                }
                else if (type.Equals("nav"))
                {

                }
            }
        }

        protected void GoNextPage_Click(object sender, System.EventArgs e)
        {
            SendCommand("{\"a\":\"moveTo\",\"where\":\"next\"}");
        }

        protected void GoPreviousPage_Click(object sender, System.EventArgs e)
        {
            SendCommand("{\"a\":\"moveTo\",\"where\":\"previous\"}");
        }

        protected void GoFirstPage_Click(object sender, System.EventArgs e)
        {
            SendCommand("{\"a\":\"moveTo\",\"where\":\"first\"}");
        }

        protected void GoLastPage_Click(object sender, System.EventArgs e)
        {
            SendCommand("{\"a\":\"moveTo\",\"where\":\"last\"}");
        }
    }
}
