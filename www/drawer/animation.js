    var toggleClass = "b_hide";
    var notransitionClass = "notransition";

    function sj_be(el, event, callback) {
        el.addEventListener(event, callback, false);
    }

    function bindGlobalDrawer(drawer) {
        var actContainer = drawer.querySelector(".actContainer");

        function toggleGlobalDrawer() {
            // hide/show the actions and set the state of the drawer
            toggleSlide(actContainer);
        }
        var expansion = drawer.getElementsByClassName("exp");
        if (expansion && expansion.length > 0) {
            sj_be(expansion[0], "click", toggleGlobalDrawer);
        }
    }
    sj_be(window, "load", function() {
        var globalDrawers = document.querySelectorAll(".actDrawer");
        if (globalDrawers) {
            for (var i = 0; i < globalDrawers.length; i++) {
                bindGlobalDrawer(globalDrawers[i]);
            }
        }
    });

    function toggleSlide(ele) {
        if (ele) {
            toggleAnimation(ele, "b_slide", true, ["height", "height"]);
        }
    }

    function toggleAnimClass(ele, anim) {
        // Due to browser optimization of style update, multiple style changes may go at the same time instead of sequentially.  
        // To force update of styles before applying the animation class, a layout property is accessed, which forces the browser
        // to update the style and layouts.
        var tmp = ele.offsetTop;
        var tmpHeight = ele.offsetHeight;
        ele.classList.toggle(anim);
    }

    function setHeight(ele) {
        var height = ele.clientHeight;
        if (height == 0 && ele.classList.contains(toggleClass)) {
            ele.classList.remove(toggleClass);
            height = ele.clientHeight;
            ele.classList.add(toggleClass);
        }
        if (height > 0) {
            ele.style.height = height + "px";
        }
        if (ele.classList.contains(notransitionClass)) {
            // Recover CSS transition
            ele.classList.remove(notransitionClass);
        }
    }

    function transitionEndHandler(evt, ele, lastProperty) {
        if (evt.target != ele) {
            return;
        }
        if (evt.propertyName === "height") {
            // Disable CSS transition before remove "height" inline sytle,
            // As this will trigger strange animation on Safari-IOS: [height] - [0] - [height] 
            ele.classList.add(notransitionClass);
            // upon height finishes animating, it should be cleared out.
            ele.style.removeProperty('height');
        }
        // send an event to signal that the ele has finished all transitions
        var prop = ele.classList.contains("b_hide") ? lastProperty[1] : lastProperty[0];
        if (evt.propertyName === prop) {
            //sj_evt.fire("transitionDone", ele);
        }
    }

    function toggleAnimation(ele, anim, animateHeight, lastProperty) {
        if (!ele.classList.contains(anim)) {
            ele.classList.add(anim);
            sj_be(ele, "transitionend", function(evt) {
                transitionEndHandler(evt, ele, lastProperty);
            });
        }

        if (animateHeight) {
            setHeight(ele);
        }
        toggleAnimClass(ele, toggleClass);
    }
