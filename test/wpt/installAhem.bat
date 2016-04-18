powershell -command "& { (New-Object Net.WebClient).DownloadFile('https://www.w3.org/Style/CSS/Test/Fonts/Ahem/AHEM____.TTF', 'AHEM____.TTF') }"
powershell -command "$fonts = (New-Object -ComObject Shell.Application).Namespace(0x14); dir AHEM____.TTF | %%{ $fonts.CopyHere($_.fullname) }"
