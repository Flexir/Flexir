# Flexir
Simple WYSIWYG editor

Flexir is a simple visual editor of various adaptive (automatically adjusted to the container width) collages, banners and other content that consists of graphics or text.

Create new document, set grid dimension, and put some content into it. Ready for use HTML fragment will be generated as a result.

![Flexir designer](http://flexir.io/images/flexir_designer.png)
*Flexir designer*

Live demo: http://flexir.io/

## Quick Start

```javascript
<!DOCTYPE html>
<html>
<head>
  <link href="//cdn.flexir.io/stable/flexir.min.css" rel="stylesheet" />
</head>
<body>
  <div id="flexir"></div>
  <script src="//ajax.aspnetcdn.com/ajax/jquery/jquery-1.11.3.min.js"></script>
  <script src="//cdn.flexir.io/stable/flexir.min.js"></script>
  <script>
    $(document).ready(
      function () {
        var f = flexir.initialize($("#flexir"));

        f.onChange(
          function () {
            var html = f.html();
          }
        );

        f.new(50, 20);
      }
    );
  </script>
</body>
</html>
```