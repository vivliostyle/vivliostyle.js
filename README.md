# vivliostyle-print
Allows page-layouting using the vivliostyle for printing within a website without destroying the original layout


How do I use it?
======

1. Install vivliostyle-print like this within your browser-based JavaScript project:

```
npm install vivliostyle-print --save
```

2. Make sure you serve the `node_modules/vivliostyle-print/dist/resources/` folder to the web.

3. Use it within your project like this:

```js
import {vivliostylePrint} from 'vivliostyle-print'

const htmlDoc = `<!doctype html>
<html>
    <head>
        <style>
        ... Add your CSS code here ...
        </style>
    </head>
    <body>
        ... Add your HTML code here ...
    </body>
</html>`,
    config = {
        title: 'my printed page',
        resourcesUrl: '/node_modules/vivliostyle-print/dist/resources/',
        printCallback: iframeWin => iframeWin.print() // optional: only needed if calling something other than window.print() for printing.
    }

vivliostylePrint(htmlDoc, config)

```

You can also take a look at the [demo](https://vivliostyle.github.io/vivliostyle-print/) ([sourcecode](/demo)) .

How do I build and run the demo?
======

1. Download the repo to your local machine, for example using::

```
git clone https://github.com/vivliostyle/vivliostyle-print.git
```

2. Enter the folder::

```
cd vivliostyle-print
```

3. Install and build it::

```
npm install
npm run build_demo
```

4. Serve the demo folder, for example using the simple PHP webserver::

```
php -S localhost:8000 -t demo/
```

5. Access the demo from a web browser by navigating to http://localhost:8000


Why would I use this rather than regular Vivliostyle?
======

Vivliostyle is somewhat complex to get to work but it gives many more options.
Vivliostyle-print only gives you what is essential to print within a browser,
and it's easier to use. Also, Vivliostyle-print only works until the print
dialog has executed and leaves no artifacts behind. You don't need to worry
about cleaning up.

What implications does the AGPL license have?
======

To be entirely sure, check with a lawyer. In just about all cases, you need to
share any modifications you have done to Vivliostyle or Vivliostyle-print itself.

Given that it is only initiated from your other program and you are nor processing
the output from Vivliostyle-print, my reading of the AGPL is that it is not part
of your program and you are not obliged to fulfill the terms of the AGPL when it
comes to the code of your own program. But I am not a lawyer. If you know a
lawyer who can check this further, please do so and let me know what you arrived
at.
