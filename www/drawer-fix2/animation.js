    var toggleClass = "b_hide";
    var notransitionClass = "notransition";

    function sj_be(el, event, callback) {
        el.addEventListener(event, callback, false);
    }

    function sj_ue(el, evt, mth, cap) {
        if (el.removeEventListener) {
            el.removeEventListener(evt, mth, cap);
        } else if (el.detachEvent) {
            el.detachEvent("on" + evt, mth);
        } else {
            el["on" + evt] = null;
        }
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
    }

    function transitionEndHandler(evt, ele, anim, lastProperty, anim) {
        if (evt.target != ele) {
            return;
        }

        // send an event to signal that the ele has finished all transitions
        var prop = ele.classList.contains("b_hide") ? lastProperty[1] : lastProperty[0];
        if (evt.propertyName === prop) {
            ele.classList.remove(anim);
            if (evt.propertyName === "height") {
                // upon height finishes animating, it should be cleared out.
                ele.style.removeProperty('height');
            }
            sj_ue(ele, "transitionend", transitionEndHandler);
            //sj_evt.fire("transitionDone", ele);
        }
    }

    function toggleAnimation(ele, anim, animateHeight, lastProperty) {
        if (animateHeight) {
            setHeight(ele);
        }
        toggleAnimClass(ele, anim);
        toggleAnimClass(ele, toggleClass);
        sj_be(ele, "transitionend", function(evt) {
            transitionEndHandler(evt, ele, anim, lastProperty, anim);
        });
    }
