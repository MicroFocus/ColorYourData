# Custom widgets's shape

A custom widget requires a shape that represents its appearance in the UI. The shape can be created directly when you design the dashboard in Visio, or you can make it reusable by saving it in **'stencils'**. The shape that you create in Visio acts as a placeholder to reflect the final rendering of the widget when it is used in a dashboard. In its simplest form, it is just a shape. But it can be advanced to provide interactive elements to define graphical attributes, like the hole size of a donut chart.

To identify a shape as a custom widget, you must define at least two properties for the shape: **opr_item_type** and **opr_dashboard_item**.

In Visio, you can define these properties in the **shape data** menu. Do the following:
1. Make sure that Visio is running in developer mode (Visio Options -> Advanced -> General -> Run in developer mode).
2. Design your dashboard and put any shape on it that will later be used as a custom widget.
3. Right click on the shape -> Data -> Define Shape Data.
    ![alt text](img/Shape_data_(1)_Open_shape_data.PNG "Define Shape Data")

4. The shape data dialog will open. Enter the required properties.
    ![alt text](img/Shape_data_(2)_Define_shape_data.PNG "Shape data dialog")

    These properties will tell BVD that this shape is a widget and needs to be treated like one.
    ```
        Name: opr_item_type
        Type: string
        Value: <type-of-your-widget>

        Name: opr_dashboard_item
        Type: Boolean
        Value: TRUE
    ```
    opr_item_type is used to internally identify the widget type. When BVD finds such a shape, it looks for a JavaScript file according to the value of opr_item_type property and inject the code into the running dashboard. Do not use **opr** to prefix the widget type, as this prefix is reserved for BVD internal use.

    The following is an example for the pumping cirlce:
    ```
        opr_item_type: opr_pumping_circle
        opr_dashboard_item: TRUE
    ```
5. Save and export the dashboard as SVG.

### Widget shape type
In BVD, there are two types of widget shapes:
- **Real shape**: The shape that represents the real widget appearance.
- **Reference shape (grouping item)**: The shape that acts as a reference for other shapes that need to be grouped together. This type of shape will receive the channel's data, but will display the other shape as its UI. This kind of shape is required, for instance, when you want to display a shape that has the rules and data from another shape. A usage example for this shape type can be found in the ***status color group*** and ***status visible group*** widget.
    To create a **Reference shape (grouping item)** widget, define one additional shape data attribute:
    ```
    Name: opr_grouping_item
    Type: Boolean
    Value: TRUE
    ```
    If this attribute is set, this shape will be removed from the dashboard and all properties assigned to it will affect the shapes grouped with this shape.

### Save custom widget's shape as stencil
In order to make a reusable custom widget shape, you can save it as a Visio **stencil**. In this example you can see how to create new set of stencils and save it to a *.vssx* file so that it can be reused later.

To create a stencil, do the following:
1. In the dashboard sidebar, you can see the list of known stencils and shapes.
   Click *More Shapes -> New Stencil (either US Units/Metric)*.
    ![alt text](img/New_stencil_(1)_create_new_stencil.PNG "New stencil")

2. A new stencil will be created. If necessary, you can rename this stencil later when saving it to the file.
    ![alt text](img/New_stencil_(2)_new_stencil_created.PNG "New stencil created")

3. Drag and drop the custom widget shape to the empty area of the stencil list.
    ![alt text](img/New_stencil_(3)_drag_custom_widget.PNG "Drag to sidebar")

4. Your new custom widget shape will be placed in the stencil list, and then you can rename it:  *Right click -> Rename Master*.
    ![alt text](img/New_stencil_(4)_rename_custom_widget.PNG "Drag to sidebar")

5. Click the save stencil button to save the custom stencil to a *.vssx* file.

6. To use this stencil when creating a dashboard, you can load the stencil to Visio.
   Click *More Shapes -> Open Stencil -> choose your .vssx file*.
