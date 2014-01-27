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
            openDialog.Filter = "EPUB files|*.epub";
           // theDialog.InitialDirectory = @"C:\";
            if (openDialog.ShowDialog() != DialogResult.OK)
            {
                return;
            }
            string file = openDialog.FileName;
            PublicationWindow publication = new PublicationWindow();
            // Set the Parent Form of the Child window.
            publication.MdiParent = this;
            // Display the new form.
            publication.Show();
            publication.Open(file);
        }
    }
}
