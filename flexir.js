// Copyright © 2018 Dmitry Sikorsky. All rights reserved.
// Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.

// flexir
(function (flexir) {
  flexir.initialize = function ($element) {
    return new flexir.Designer($element);
  };
})(window.flexir = window.flexir || {});

// flexir.Designer class
(function (flexir) {
  // Constructor
  flexir.Designer = function ($designer) {
    this.$designer = $designer.addClass("flexir__designer");
    this.commandQueue = null;
    this.toolbar = null;
    this.workspace = null;
    this.footer = null;
    this.onChangeEventHandler = null;
  }

  // Public functions
  flexir.Designer.prototype.new = function (xCellsCount, yCellsCount, showPromt) {
    if (showPromt && !confirm("Create new document?")) {
      return;
    }

    this.$designer.empty();
    this.commandQueue = new flexir.CommandQueue(this);
    this.toolbar = new flexir.Toolbar(this);
    this.workspace = new flexir.Workspace(this, xCellsCount, yCellsCount);
    this.footer = new flexir.Footer(this);
    bindEvents(this);
  };

  flexir.Designer.prototype.html = function (html) {
    if (html == null) {
      return getHtml(this);
    }

    setHtml(this, html);
  }

  // Events
  flexir.Designer.prototype.onChange = function (eventHandler) {
    this.onChangeEventHandler = eventHandler;
  };

  // Private functions
  function bindEvents(designer) {
    bindCommandQueueEvents(designer);
    bindToolbarEvents(designer);
    bindWorkspaceEvents(designer);
  }

  function bindCommandQueueEvents(designer) {
    bindCommandQueueOnChangeEvent(designer);
  }

  function bindCommandQueueOnChangeEvent(designer) {
    designer.commandQueue.onChange(
      function (canUndo, canRedo) {
        if (canUndo) {
          designer.toolbar.enableUndoButton();
        }

        else {
          designer.toolbar.disableUndoButton();
        }

        if (canRedo) {
          designer.toolbar.enableRedoButton();
        }

        else {
          designer.toolbar.disableRedoButton();
        }

        if (designer.onChangeEventHandler != null) {
          designer.onChangeEventHandler();
        }
      }
    );
  }

  function bindToolbarEvents(designer) {
    bindToolbarOnButtonClickEvent(designer);
  }

  function bindToolbarOnButtonClickEvent(designer) {
    designer.toolbar.onButtonClick(
      function (commandCode) {
        switch (commandCode) {
          case "new": designer.new(50, 20, true); break;
          case "undo": undo(designer); break;
          case "redo": redo(designer); break;
          case "remove": removeSelectedCell(designer); break;
          case "bringToFront": bringSelectedCellToFront(designer); break;
          case "sendToBack": sendSelectedCellToBack(designer); break;
          case "setFont": setSelectedCellFont(designer); break;
          case "setText": setSelectedCellText(designer); break;
          case "setBackgroundImage": setSelectedCellBackgroundImage(designer); break;
        }
      }
    );
  }

  function bindWorkspaceEvents(designer) {
    bindWorkspaceOnPointerCoordinatesChangeEvent(designer);
    bindWorkspaceOnCellCreateEvent(designer);
    bindWorkspaceOnCellSelectEvent(designer);
    bindWorkspaceOnCellUnselectEvent(designer);
  }

  function bindWorkspaceOnPointerCoordinatesChangeEvent(designer) {
    designer.workspace.onPointerCoordinatesChange(
      function (x, y, width, height) {
        var text = "";

        if (x == -1 && y == -1) {
          text = "Nothing to show";
        }

        else {
          text = "X = <b>" + x + "</b>, Y = <b>" + y + "</b>";

          if (width != null && height != null) {
            text += ", W = <b>" + width + "</b>, H = <b>" + height + "</b>";
          }
        }

        designer.footer.setText(text);
      }
    );
  }

  function bindWorkspaceOnCellCreateEvent(designer) {
    designer.workspace.onCellCreate(
      function (x, y, width, height) {
        designer.commandQueue.execute(
          new flexir.CreateCellCommand(designer.workspace, x, y, width, height)
        );
      }
    );
  }

  function bindWorkspaceOnCellSelectEvent(designer) {
    designer.workspace.onCellSelect(
      function ($cell) {
        designer.toolbar.enableContextButtons();
      }
    );
  }

  function bindWorkspaceOnCellUnselectEvent(designer) {
    designer.workspace.onCellUnselect(
      function ($cell) {
        designer.toolbar.disableContextButtons();
      }
    );
  }

  function undo(designer) {
    designer.commandQueue.unexecute();
  };

  function redo(designer) {
    designer.commandQueue.execute();
  };

  function removeSelectedCell(designer) {
    var $selectedCell = designer.workspace.currentLayer.getSelectedCell();

    designer.commandQueue.execute(
      new flexir.RemoveCellCommand(designer.workspace, $selectedCell)
    );
  };

  function bringSelectedCellToFront(designer) {
    var $selectedCell = designer.workspace.currentLayer.getSelectedCell();

    designer.commandQueue.execute(
      new flexir.BringCellToFrontCommand(designer.workspace, $selectedCell)
    );
  };

  function sendSelectedCellToBack(designer) {
    var $selectedCell = designer.workspace.currentLayer.getSelectedCell();

    designer.commandQueue.execute(
      new flexir.SendCellToBackCommand(designer.workspace, $selectedCell)
    );
  };

  function setSelectedCellFont(designer) {
    var $selectedCell = designer.workspace.currentLayer.getSelectedCell();
    var font = prompt("Font:", 'normal 2vw "Roboto", sans-serif');

    designer.commandQueue.execute(
      new flexir.SetCellFontCommand(designer.workspace, $selectedCell, font)
    );
  };

  function setSelectedCellText(designer) {
    var $selectedCell = designer.workspace.currentLayer.getSelectedCell();
    var text = prompt("Text:", "Hello, world!");

    designer.commandQueue.execute(
      new flexir.SetCellTextCommand(designer.workspace, $selectedCell, text)
    );
  };

  function setSelectedCellBackgroundImage(designer) {
    var $selectedCell = designer.workspace.currentLayer.getSelectedCell();
    var backgroundImage = prompt("Background image:", "http://cdn.flexir.io/sample.jpg");

    designer.commandQueue.execute(
      new flexir.SetCellBackgroundImageCommand(designer.workspace, $selectedCell, backgroundImage)
    );
  };

  function getHtml(designer) {
    if (designer.workspace == null) {
      return null;
    }

    var $workspace = designer.workspace.$workspace.clone();

    $workspace.removeClass("flexir__designer__workspace");
    $workspace.find("canvas").remove();
    $workspace.find("div")
      .removeClass("flexir__designer__layer")
      .removeClass("flexir__designer__cell")
      .removeClass("flexir__designer__cell--selected");

    return $workspace[0].outerHTML;
  }

  function setHtml(designer, html) {
    var $workspace = $(html);

    $workspace.addClass("flexir__designer__workspace");
    $workspace.find(".flexir__layer").addClass("flexir__designer__layer");
    $workspace.find(".flexir__cell").addClass("flexir__designer__cell");
    $workspace.find(".flexir__cell").appendTo(designer.workspace.currentLayer.$layer);
    
    $(".flexir__cell").each(
      function () {
        var $cell = $(this);

        designer.workspace.currentLayer.bindCellEvents($cell);
      }
    );

    if (designer.onChangeEventHandler != null) {
      designer.onChangeEventHandler();
    }
  }
})(window.flexir = window.flexir || {});

// flexir.CommandQueue class
(function (flexir) {
  // Constructor
  flexir.CommandQueue = function (designer) {
    this.designer = designer;
    this.commands = [];
    this.current = -1;
    this.onChangedEventHandler = null;
  };

  // Public functions
  flexir.CommandQueue.prototype.execute = function (command) {
    if (command == null) {
      var command = this.commands[this.current + 1];

      command.execute();
      this.current++;
    }

    else {
      if (this.current < this.commands.length - 1) {
        this.commands.length = this.current + 1;
      }

      this.commands.push(command);
      this.current++;
      command.execute();
    }

    if (this.onChangedEventHandler != null) {
      this.onChangedEventHandler(getCanUndo(this), getCanRedo(this));
    }
  };

  flexir.CommandQueue.prototype.unexecute = function () {
    var command = this.commands[this.current];

    command.unexecute();
    this.current--;

    if (this.onChangedEventHandler != null) {
      this.onChangedEventHandler(getCanUndo(this), getCanRedo(this));
    }
  };

  // Events
  flexir.CommandQueue.prototype.onChange = function (eventHandler) {
    this.onChangedEventHandler = eventHandler;
  };

  // Private functions
  function getCanUndo(commandQueue) {
    return commandQueue.current != -1;
  }

  function getCanRedo(commandQueue) {
    return commandQueue.current < commandQueue.commands.length - 1;
  }
})(window.flexir = window.flexir || {});

// flexir.CreateCellCommand class
(function (flexir) {
  // Constructor
  flexir.CreateCellCommand = function (workspace, x, y, width, height) {
    this.workspace = workspace;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.$cell = null;
  };

  // Public functions
  flexir.CreateCellCommand.prototype.execute = function () {
    if (this.$cell == null) {
      this.$cell = this.workspace.currentLayer.createCell(this.x, this.y, this.width, this.height);
    }

    else {
      this.workspace.currentLayer.addCell(this.$cell);
    }
  };

  flexir.CreateCellCommand.prototype.unexecute = function () {
    this.workspace.currentLayer.removeCell(this.$cell);
  };
})(window.flexir = window.flexir || {});

// flexir.RemoveCellCommand class
(function (flexir) {
  // Constructor
  flexir.RemoveCellCommand = function (workspace, $cell) {
    this.workspace = workspace;
    this.$cell = $cell;
  };

  // Public functions
  flexir.RemoveCellCommand.prototype.execute = function () {
    this.workspace.currentLayer.removeCell(this.$cell);
  };

  flexir.RemoveCellCommand.prototype.unexecute = function () {
    this.workspace.currentLayer.addCell(this.$cell);
  };
})(window.flexir = window.flexir || {});

// flexir.BringCellToFrontCommand class
(function (flexir) {
  // Constructor
  flexir.BringCellToFrontCommand = function (workspace, $cell) {
    this.workspace = workspace;
    this.$cell = $cell;
    this.previousZIndex = null;
  };

  // Public functions
  flexir.BringCellToFrontCommand.prototype.execute = function () {
    this.previousZIndex = this.$cell.css("z-index");
    this.workspace.currentLayer.bringCellToFront(this.$cell);
  };

  flexir.BringCellToFrontCommand.prototype.unexecute = function () {
    this.$cell.css("z-index", this.previousZIndex);
  };
})(window.flexir = window.flexir || {});

// flexir.SendCellToBackCommand class
(function (flexir) {
  // Constructor
  flexir.SendCellToBackCommand = function (workspace, $cell) {
    this.workspace = workspace;
    this.$cell = $cell;
    this.previousZIndex = null;
  };

  // Public functions
  flexir.SendCellToBackCommand.prototype.execute = function () {
    this.previousZIndex = this.$cell.css("z-index");
    this.workspace.currentLayer.sendCellToBack(this.$cell);
  };

  flexir.SendCellToBackCommand.prototype.unexecute = function () {
    this.$cell.css("z-index", this.previousZIndex);
  };
})(window.flexir = window.flexir || {});

// flexir.SetCellFontCommand class
(function (flexir) {
  // Constructor
  flexir.SetCellFontCommand = function (workspace, $cell, font) {
    this.workspace = workspace;
    this.$cell = $cell;
    this.font = font;
    this.previousFont = null;
  };

  // Public functions
  flexir.SetCellFontCommand.prototype.execute = function () {
    this.previousFont = this.$cell.css("font");
    this.$cell.css("font", this.font);
  };

  flexir.SetCellFontCommand.prototype.unexecute = function () {
    this.$cell.css("font", this.previousFont);
  };
})(window.flexir = window.flexir || {});

// flexir.SetCellTextCommand class
(function (flexir) {
  // Constructor
  flexir.SetCellTextCommand = function (workspace, $cell, text) {
    this.workspace = workspace;
    this.$cell = $cell;
    this.text = text;
    this.previousText = null;
  };

  // Public functions
  flexir.SetCellTextCommand.prototype.execute = function () {
    this.previousText = this.$cell.html();
    this.$cell.html(this.text);
  };

  flexir.SetCellTextCommand.prototype.unexecute = function () {
    this.$cell.html(this.previousText);
  };
})(window.flexir = window.flexir || {});

// flexir.SetCellBackgroundImageCommand class
(function (flexir) {
  // Constructor
  flexir.SetCellBackgroundImageCommand = function (workspace, $cell, backgroundImage) {
    this.workspace = workspace;
    this.$cell = $cell;
    this.backgroundImage = "url(" + backgroundImage + ")";
    this.previousBackgroundImage = null;
  };

  // Public functions
  flexir.SetCellBackgroundImageCommand.prototype.execute = function () {
    this.previousBackgroundImage = this.$cell.css("background-image");
    this.$cell.css("background-image", this.backgroundImage);
  };

  flexir.SetCellBackgroundImageCommand.prototype.unexecute = function () {
    this.$cell.css("background-image", this.previousBackgroundImage);
  };
})(window.flexir = window.flexir || {});

// flexir.Toolbar class
(function (flexir) {
  // Constructor
  flexir.Toolbar = function (designer) {
    this.designer = designer;
    this.$toolbar = createToolbar(this).appendTo(this.designer.$designer);
    this.onButtonClickedEventHandler = null;
  };

  // Public functions
  flexir.Toolbar.prototype.enableUndoButton = function () {
    $("." + getButtonCssClass("undo")).removeClass("flexir__button--disabled");
  }

  flexir.Toolbar.prototype.disableUndoButton = function () {
    $("." + getButtonCssClass("undo")).addClass("flexir__button--disabled");
  }

  flexir.Toolbar.prototype.enableRedoButton = function () {
    $("." + getButtonCssClass("redo")).removeClass("flexir__button--disabled");
  }

  flexir.Toolbar.prototype.disableRedoButton = function () {
    $("." + getButtonCssClass("redo")).addClass("flexir__button--disabled");
  }

  flexir.Toolbar.prototype.enableContextButtons = function () {
    $("." + getButtonCssClass("remove")).removeClass("flexir__button--disabled");
    $("." + getButtonCssClass("bringToFront")).removeClass("flexir__button--disabled");
    $("." + getButtonCssClass("sendToBack")).removeClass("flexir__button--disabled");
    $("." + getButtonCssClass("setFont")).removeClass("flexir__button--disabled");
    $("." + getButtonCssClass("setText")).removeClass("flexir__button--disabled");
    $("." + getButtonCssClass("setBackgroundImage")).removeClass("flexir__button--disabled");
  };

  flexir.Toolbar.prototype.disableContextButtons = function () {
    $("." + getButtonCssClass("remove")).addClass("flexir__button--disabled");
    $("." + getButtonCssClass("bringToFront")).addClass("flexir__button--disabled");
    $("." + getButtonCssClass("sendToBack")).addClass("flexir__button--disabled");
    $("." + getButtonCssClass("setFont")).addClass("flexir__button--disabled");
    $("." + getButtonCssClass("setText")).addClass("flexir__button--disabled");
    $("." + getButtonCssClass("setBackgroundImage")).addClass("flexir__button--disabled");
  };

  // Events
  flexir.Toolbar.prototype.onButtonClick = function (eventHandler) {
    this.onButtonClickedEventHandler = eventHandler;
  };

  // Private functions
  function createToolbar(toolbar) {
    var $toolbar = $("<div>").addClass("flexir__toolbar");

    createButton(toolbar, "new").appendTo($toolbar);
    createSeparator().appendTo($toolbar);
    createButton(toolbar, "undo", true).appendTo($toolbar);
    createButton(toolbar, "redo", true).appendTo($toolbar);
    createSeparator().appendTo($toolbar);
    createButton(toolbar, "remove", true).appendTo($toolbar);
    createButton(toolbar, "bringToFront", true).appendTo($toolbar);
    createButton(toolbar, "sendToBack", true).appendTo($toolbar);
    createSeparator().appendTo($toolbar);
    createButton(toolbar, "setFont", true).appendTo($toolbar);
    createButton(toolbar, "setText", true).appendTo($toolbar);
    createButton(toolbar, "setBackgroundImage", true).appendTo($toolbar);
    return $toolbar;
  }

  function createButton(toolbar, commandCode, isDisabled) {
    return $("<a>")
      .addClass("flexir__toolbar__button")
      .addClass("flexir__button")
      .addClass(isDisabled ? "flexir__button--disabled" : null)
      .addClass(getButtonCssClass(commandCode))
      .attr("href", "#" + commandCode)
      .attr("title", getButtonTooltip(commandCode))
      .attr("data-command-code", commandCode)
      .click(
      function () {
          if ($(this).hasClass("flexir__button--disabled")) {
            return false;
          }

          if (toolbar.onButtonClickedEventHandler != null) {
            toolbar.onButtonClickedEventHandler(commandCode);
            return false;
          }
        }
      );
  }

  function createSeparator() {
    return $("<div>").addClass("flexir__toolbar__separator").addClass("flexir__separator");
  }

  function getButtonCssClass(commandCode) {
    switch (commandCode) {
      case "new": return "flexir__button--new";
      case "undo": return "flexir__button--undo";
      case "redo": return "flexir__button--redo";
      case "remove": return "flexir__button--remove";
      case "bringToFront": return "flexir__button--bring-to-front";
      case "sendToBack": return "flexir__button--send-to-back";
      case "setFont": return "flexir__button--set-font";
      case "setText": return "flexir__button--set-text";
      case "setBackgroundImage": return "flexir__button--set-background-image";
    }

    return null;
  }

  function getButtonTooltip(commandCode) {
    switch (commandCode) {
      case "new": return "New";
      case "undo": return "Undo";
      case "redo": return "Redo";
      case "remove": return "Remove";
      case "bringToFront": return "Bring to front";
      case "sendToBack": return "Send to back";
      case "setFont": return "Set font";
      case "setText": return "Set text";
      case "setBackgroundImage": return "Set background image";
    }

    return null;
  }
})(window.flexir = window.flexir || {});

// flexir.Workspace class
(function (flexir) {
  // Constructor
  flexir.Workspace = function (designer, xCellsCount, yCellsCount) {
    this.designer = designer;
    this.xCellsCount = xCellsCount;
    this.yCellsCount = yCellsCount;
    this.$workspace = createWorkspace(this.xCellsCount, this.yCellsCount).appendTo(this.designer.$designer);
    this.geometry = new flexir.Geometry(this);
    this.pointer = new flexir.Pointer(this);

    var _this = this;

    this.backgroundCanvas = new flexir.Canvas(this, function (graphics) { drawBackgroundEventHandler(_this, graphics); });
    this.foregroundCanvas = new flexir.Canvas(this, function (graphics) { drawForegroundEventHandler(_this, graphics); });
    this.currentLayer = new flexir.Layer(this);
    this.onPointerCoordinatesChangeEventHandler = null;
    this.onCellCreateEventHandler = null;
    this.onCellSelectEventHandler = null;
    this.onCellUnselectEventHandler = null;
    bindEvents(this);
  };

  // Events
  flexir.Workspace.prototype.onPointerCoordinatesChange = function (eventHandler) {
    this.onPointerCoordinatesChangeEventHandler = eventHandler;
  };

  flexir.Workspace.prototype.onCellCreate = function (eventHandler) {
    this.onCellCreateEventHandler = eventHandler;
  };

  flexir.Workspace.prototype.onCellSelect = function (eventHandler) {
    this.onCellSelectEventHandler = eventHandler;
  };

  flexir.Workspace.prototype.onCellUnselect = function (eventHandler) {
    this.onCellUnselectEventHandler = eventHandler;
  };

  // Private functions
  function createWorkspace(xCellsCount, yCellsCount) {
    return $("<div>")
      .addClass("flexir__designer__workspace")
      .addClass("flexir__workspace")
      .css({ paddingTop: Math.floor(yCellsCount / xCellsCount * 100.0) + "%" })
      .attr("data-workspace", "")
      .attr("data-workspace-x-cells-count", xCellsCount)
      .attr("data-workspace-y-cells-count", yCellsCount);
  }

  function bindEvents(workspace) {
    bindPointerEvents(workspace);
    bindLayerEvents(workspace);
  }

  function bindPointerEvents(workspace) {
    bindPointerOnMouseMoveEvent(workspace);
    bindPointerOnMouseLeaveEvent(workspace);
    bindPointerOnMouseDownEvent(workspace);
    bindPointerOnMouseUpEvent(workspace);
  }

  function bindPointerOnMouseMoveEvent(workspace) {
    workspace.pointer.onMouseMove(
      function () {
        workspace.foregroundCanvas.invalidate();

        if (workspace.onPointerCoordinatesChangeEventHandler != null) {
          if (workspace.pointer.isLeftButtonPressed) {
            var cellStartPosition = workspace.geometry.getNearestCellCoordinates(workspace.pointer.startX, workspace.pointer.startY);
            var cellPosition = workspace.geometry.getNearestCellCoordinates(workspace.pointer.x, workspace.pointer.y);

            workspace.onPointerCoordinatesChangeEventHandler(
              cellStartPosition.x,
              cellStartPosition.y,
              cellPosition.x - cellStartPosition.x + 1,
              cellPosition.y - cellStartPosition.y + 1
            );
          }

          else {
            var cellPosition = workspace.geometry.getNearestCellCoordinates(workspace.pointer.x, workspace.pointer.y);

            workspace.onPointerCoordinatesChangeEventHandler(cellPosition.x, cellPosition.y);
          }
        }
      }
    );
  }

  function bindPointerOnMouseLeaveEvent(workspace) {
    workspace.pointer.onMouseLeave(
      function () {
        workspace.foregroundCanvas.invalidate();

        if (workspace.onPointerCoordinatesChangeEventHandler != null) {
          workspace.onPointerCoordinatesChangeEventHandler(-1, -1);
        }
      }
    );
  }

  function bindPointerOnMouseDownEvent(workspace) {
    workspace.pointer.onMouseDown(
      function () {
        workspace.foregroundCanvas.invalidate();
      }
    );
  }

  function bindPointerOnMouseUpEvent(workspace) {
    workspace.pointer.onMouseUp(
      function () {
        workspace.foregroundCanvas.invalidate();

        if (workspace.onCellCreateEventHandler != null) {
          var cellStartPosition = workspace.geometry.getNearestCellCoordinates(workspace.pointer.startX, workspace.pointer.startY);
          var cellPosition = workspace.geometry.getNearestCellCoordinates(workspace.pointer.x, workspace.pointer.y);

          workspace.onCellCreateEventHandler(
            cellStartPosition.x,
            cellStartPosition.y,
            cellPosition.x - cellStartPosition.x + 1,
            cellPosition.y - cellStartPosition.y + 1
          );
        }
      }
    );
  }

  function bindLayerEvents(workspace) {
    bindLayerOnCellSelectEvent(workspace);
    bindLayerOnCellUnselectEvent(workspace);
  }

  function bindLayerOnCellSelectEvent(workspace) {
    workspace.currentLayer.onCellSelect(
      function ($cell) {
        if (workspace.onCellSelectEventHandler != null) {
          workspace.onCellSelectEventHandler($cell);
        }
      }
    );
  }

  function bindLayerOnCellUnselectEvent(workspace) {
    workspace.currentLayer.onCellUnselect(
      function ($cell) {
        if (workspace.onCellUnselectEventHandler != null) {
          workspace.onCellUnselectEventHandler($cell);
        }
      }
    );
  }

  // Event handlers
  function drawBackgroundEventHandler(workspace, graphics) {
    var cellSize = workspace.geometry.getCellSize();

    for (var x = 1; x < workspace.xCellsCount + 1; x++) {
      for (var y = 1; y < workspace.yCellsCount + 1; y++) {
        graphics.fillRect((x - 1) * cellSize, (y - 1) * cellSize, cellSize, cellSize, ((x + y) % 2 == 0 ? "#fafafa" : "#fff"));
      }
    }
  }

  function drawForegroundEventHandler(workspace, graphics) {
    if (!workspace.pointer.isLeftButtonPressed && workspace.pointer.x != -1 && workspace.pointer.y != -1) {
      var cellSize = workspace.geometry.getCellSize();
      var cellPosition = workspace.geometry.getNearestCellPosition(workspace.pointer.x, workspace.pointer.y);

      graphics.fillRect(cellPosition.x, cellPosition.y, cellSize, cellSize, "#ffff96");
    }

    else if (workspace.pointer.isLeftButtonPressed && workspace.pointer.x != -1 && workspace.pointer.y != -1 && workspace.pointer.startX != -1 && workspace.pointer.startY != -1) {
      var cellSize = workspace.geometry.getCellSize();
      var startCellPosition = workspace.geometry.getNearestCellPosition(workspace.pointer.startX, workspace.pointer.startY);
      var cellPosition = workspace.geometry.getNearestCellPosition(workspace.pointer.x, workspace.pointer.y);

      graphics.fillRect(
        startCellPosition.x,
        startCellPosition.y,
        cellPosition.x - startCellPosition.x + cellSize,
        cellPosition.y - startCellPosition.y + cellSize,
        "#0096fa"
      );
    }
  }
})(window.flexir = window.flexir || {});

// flexir.Pointer class
(function (flexir) {
  // Constructor
  flexir.Pointer = function (workspace) {
    this.workspace = workspace;
    this.startX = -1;
    this.startY = -1;
    this.x = -1;
    this.y = -1;
    this.isLeftButtonPressed = false;
    this.onMouseMoveEventHandler = null;
    this.onMouseLeaveEventHandler = null;
    this.onMouseDownEventHandler = null;
    this.onMouseUpEventHandler = null;
    bindEvents(this);
  };

  // Events
  flexir.Pointer.prototype.onMouseMove = function (eventHandler) {
    this.onMouseMoveEventHandler = eventHandler;
  };

  flexir.Pointer.prototype.onMouseLeave = function (eventHandler) {
    this.onMouseLeaveEventHandler = eventHandler;
  };

  flexir.Pointer.prototype.onMouseDown = function (eventHandler) {
    this.onMouseDownEventHandler = eventHandler;
  };

  flexir.Pointer.prototype.onMouseUp = function (eventHandler) {
    this.onMouseUpEventHandler = eventHandler;
  };

  // Private functions
  function bindEvents(pointer) {
    pointer.workspace.$workspace.on("mousemove", pointer, onMouseMove);
    pointer.workspace.$workspace.on("mouseleave", pointer, onMouseLeave);
    pointer.workspace.$workspace.on("mousedown", pointer, onMouseDown);
    $(document).on("mouseup", pointer, onMouseUp);
  }

  // Event handlers
  function onMouseMove(event) {
    var pointer = event.data;
    var offset = $(this).offset();

    pointer.x = pointer.workspace.geometry.scaleDimension(event.pageX - offset.left);

    if (pointer.x < pointer.startX) {
      pointer.x = pointer.startX;
    }

    pointer.y = pointer.workspace.geometry.scaleDimension(event.pageY - offset.top);

    if (pointer.y < pointer.startY) {
      pointer.y = pointer.startY;
    }

    if (pointer.onMouseMoveEventHandler != null) {
      pointer.onMouseMoveEventHandler();
    }
  }

  function onMouseLeave(event) {
    var pointer = event.data;

    if (!pointer.isLeftButtonPressed) {
      pointer.x = -1;
      pointer.y = -1;
    }

    if (pointer.onMouseLeaveEventHandler != null) {
      pointer.onMouseLeaveEventHandler();
    }
  }

  function onMouseDown(event) {
    var pointer = event.data;
    var offset = $(this).offset();

    pointer.isLeftButtonPressed = true;
    pointer.startX = pointer.workspace.geometry.scaleDimension(event.pageX - offset.left);
    pointer.startY = pointer.workspace.geometry.scaleDimension(event.pageY - offset.top);

    if (pointer.onMouseDownEventHandler != null) {
      pointer.onMouseDownEventHandler();
    }

    return false;
  }

  function onMouseUp(event) {
    var pointer = event.data;

    if (pointer.startX == -1 || pointer.startY == -1) {
      return;
    }

    if (pointer.onMouseUpEventHandler != null) {
      pointer.onMouseUpEventHandler();
    }

    pointer.isLeftButtonPressed = false;
    pointer.startX = -1;
    pointer.startY = -1;
    return false;
  }
})(window.flexir = window.flexir || {});

// flexir.Canvas class
(function (flexir) {
  // Constructor
  flexir.Canvas = function (workspace, drawEventHandler) {
    this.workspace = workspace;
    this.drawEventHandler = drawEventHandler;
    this.$canvas = createCanvas().appendTo(this.workspace.$workspace);
    this.graphics = new flexir.Graphics(this);
    this.invalidate();
    bindEvents(this);
  };

  // Public functions
  flexir.Canvas.prototype.invalidate = function () {
    this.graphics.invalidate();

    if (this.drawEventHandler != null) {
      this.drawEventHandler(this.graphics);
    }
  };

  // Private functions
  function createCanvas() {
    return $("<canvas>").addClass("flexir__workspace__canvas").addClass("flexir__canvas");
  }

  function bindEvents(canvas) {
    $(window).on("resize", canvas, onResize);
  }

  // Event handlers
  function onResize(event) {
    var canvas = event.data;

    canvas.graphics = new flexir.Graphics(canvas);
    canvas.invalidate();
  }
})(window.flexir = window.flexir || {});

// flexir.Layer class
(function (flexir) {
  // Constructor
  flexir.Layer = function (workspace) {
    this.workspace = workspace;
    this.$layer = createLayer().appendTo(this.workspace.$workspace);
    this.onCellSelectEventHandler = null;
    this.onCellUnselectEventHandler = null;
  };

  // Public functions
  flexir.Layer.prototype.createCell = function (x, y, width, height) {
    x = x / this.workspace.xCellsCount * 100.0;
    y = y / this.workspace.yCellsCount * 100.0;
    width = width / this.workspace.xCellsCount * 100.0;
    height = height / this.workspace.yCellsCount * 100.0;

    var $cell = $("<div>")
      .addClass("flexir__designer__cell")
      .addClass("flexir__layer__cell")
      .addClass("flexir__cell")
      .attr("data-cell", "")
      .css(
        {
          left: x + "%",
          top: y + "%",
          width: width + "%",
          height: height + "%",
          zIndex: getMaxCellZIndex() + 1
        }
      ).appendTo(this.$layer);

    this.bindCellEvents($cell);
    this.selectCell($cell);
    return $cell;
  };

  flexir.Layer.prototype.addCell = function ($cell) {
    $cell.appendTo(this.$layer);
    this.bindCellEvents($cell);
    this.selectCell($cell);
  };

  flexir.Layer.prototype.removeCell = function ($cell) {
    if ($cell.hasClass("flexir__designer__cell--selected")) {
      this.unselectCell($cell);
    }

    $cell.remove();
  };

  flexir.Layer.prototype.bindCellEvents = function ($cell) {
    var _this = this;

    $cell
      .mousedown(
        function () {
          toggleCellSelection(_this, $cell);
          return false;
        }
      );
  };

  flexir.Layer.prototype.getSelectedCell = function () {
    var $selectedCell = $(".flexir__designer__cell--selected");

    if ($selectedCell.length == 0) {
      return null;
    }

    return $selectedCell;
  };

  flexir.Layer.prototype.selectCell = function ($cell) {
    var $selectedCell = $(".flexir__designer__cell--selected");

    if ($selectedCell.length != 0) {
      this.unselectCell($selectedCell);
    }

    $cell.addClass("flexir__designer__cell--selected");

    if (this.onCellSelectEventHandler != null) {
      this.onCellSelectEventHandler(this);
    }
  };

  flexir.Layer.prototype.unselectCell = function ($cell) {
    $cell.removeClass("flexir__designer__cell--selected");

    if (this.onCellUnselectEventHandler != null) {
      this.onCellUnselectEventHandler(this);
    }
  };

  flexir.Layer.prototype.bringCellToFront = function ($cell) {
    $cell.css("z-index", getMaxCellZIndex() + 1);
  };

  flexir.Layer.prototype.sendCellToBack = function ($cell) {
    $cell.css("z-index", getMinCellZIndex() - 1);
  };

  // Events
  flexir.Layer.prototype.onCellSelect = function (eventHandler) {
    this.onCellSelectEventHandler = eventHandler;
  };

  flexir.Layer.prototype.onCellUnselect = function (eventHandler) {
    this.onCellUnselectEventHandler = eventHandler;
  };

  // Private functions
  function createLayer() {
    return $("<div>")
      .addClass("flexir__designer__layer")
      .addClass("flexir__workspace__layer")
      .addClass("flexir__layer")
      .attr("data-layer", "");
  }

  function toggleCellSelection(layer, $cell) {
    if ($cell.hasClass("flexir__designer__cell--selected")) {
      layer.unselectCell($cell);
    }

    else {
      layer.selectCell($cell);
    }
  }

  function getMinCellZIndex() {
    var minZIndex = Number.MAX_SAFE_INTEGER;

    $(".flexir__cell").each(
      function () {
        var zIndex = parseInt($(this).css("zIndex"), 0);

        if (zIndex < minZIndex) {
          minZIndex = zIndex;
        }
      }
    );

    return minZIndex;
  }

  function getMaxCellZIndex() {
    var maxZIndex = 1000;

    $(".flexir__cell").each(
      function () {
        var zIndex = parseInt($(this).css("zIndex"), 0);

        if (zIndex > maxZIndex) {
          maxZIndex = zIndex;
        }
      }
    );

    return maxZIndex;
  }
})(window.flexir = window.flexir || {});

// flexir.Graphics class
(function (flexir) {
  // Constructor
  flexir.Graphics = function (canvas) {
    this.context = canvas.$canvas[0].getContext("2d");
    this.context.canvas.width = canvas.workspace.geometry.getWidth();
    this.context.canvas.height = canvas.workspace.geometry.getHeight();
  };

  // Public functions
  flexir.Graphics.prototype.invalidate = function () {
    this.invalidateRect(0, 0, this.context.canvas.width, this.context.canvas.height);
  };

  flexir.Graphics.prototype.invalidateRect = function (x, y, width, height) {
    this.context.clearRect(x, y, width, height);
  };

  flexir.Graphics.prototype.drawLine = function (x1, y1, x2, y2, color) {
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.lineWidth = 1;
    this.context.strokeStyle = color;
    this.context.stroke();
  };

  flexir.Graphics.prototype.fillRect = function (x, y, width, height, color) {
    this.context.fillStyle = color;
    this.context.fillRect(x, y, width, height);
  };
})(window.flexir = window.flexir || {});

// flexir.Geometry class
(function (flexir) {
  // Constructor
  flexir.Geometry = function (workspace) {
    this.workspace = workspace;
  };

  // Public functions
  flexir.Geometry.prototype.getWidth = function () {
    return this.scaleDimension(this.workspace.$workspace.innerWidth());
  };

  flexir.Geometry.prototype.getHeight = function () {
    return this.scaleDimension(this.workspace.$workspace.innerHeight());
  };

  flexir.Geometry.prototype.getCellSize = function () {
    return this.getWidth() / this.workspace.xCellsCount;
  };

  flexir.Geometry.prototype.getNearestCellCoordinates = function (x, y) {
    var cellSize = this.getCellSize();
    var x = Math.floor(x / cellSize);
    var y = Math.floor(y / cellSize);

    return { x: x, y: y };
  };

  flexir.Geometry.prototype.getNearestCellPosition = function (x, y) {
    var cellCoordinates = this.getNearestCellCoordinates(x, y);
    var cellSize = this.getCellSize();

    return { x: cellCoordinates.x * cellSize, y: cellCoordinates.y * cellSize };
  };

  flexir.Geometry.prototype.scaleDimension = function (dimension) {
    return dimension * window.devicePixelRatio;
  };
})(window.flexir = window.flexir || {});

// flexir.Footer class
(function (flexir) {
  // Constructor
  flexir.Footer = function (designer) {
    this.designer = designer;
    this.$footer = createFooter(this).appendTo(this.designer.$designer);
  };

  // Public functions
  flexir.Footer.prototype.setText = function (text) {
    text = text.replace(/<b>/g, "<span class=\"flexir__status--highlighted\">");
    text = text.replace(/<\/b>/g, "</span>");

    this.$footer.find(".flexir__status").html(text);
  };

  // Private functions
  function createFooter(toolbar) {
    var footer = $("<div>").addClass("flexir__footer");

    $("<div>")
      .addClass("flexir__footer__status")
      .addClass("flexir__status")
      .html("Nothing to show")
      .appendTo(footer);

    $("<a>")
      .addClass("flexir__footer__title")
      .addClass("flexir__title")
      .attr("href", "http://flexir.io")
      .attr("target", "_blank")
      .html("<span class=\"flexir__title--highlighted\">Flexir</span> 1.0.0-alpha1")
      .appendTo(footer);

    return footer;
  }
})(window.flexir = window.flexir || {});