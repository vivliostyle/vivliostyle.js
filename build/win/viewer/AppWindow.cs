using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Viewer
{
    public partial class AppWindow : Form
    {
        public AppWindow()
        {
            InitializeComponent();
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
            PublicationWindow publication = new PublicationWindow();
            publication.MdiParent = this;
            publication.Show();
            publication.WindowState = FormWindowState.Maximized;
            publication.Open(file, !unpackaged, !not_zipped);
        }

        private void FileExit_Click(object sender, EventArgs e)
        {
            Dispose();
        }

        private void FileClose_Click(object sender, EventArgs e)
        {
            Form activeChild = ActiveMdiChild;
            if (activeChild != null)
            {
                activeChild.Close();
            }
        }

        private void AppWindow_Load(object sender, EventArgs e)
        {
            //Icon icon = new Icon("resources/magazine.ico");
            //this.Icon = icon;
        }
    }
}
