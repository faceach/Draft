o = n[t].apply(n, s);
this.recordApiTimeDetail(i ? i + "P" : null, t);
u && u > 0 && (e = sb_st(function() {
    o && o.cancel && o.cancel();
    c("T");
    f && f(null)
}, u));
o.then(function(n) {
    return e && sb_ct(e), c("C"), n
}, function(n) {
    e && sb_ct(e);
    c("E", n);
    SharedLogHelper.LogError("Exception", "Failed in overrideMethod callback: " + t, n);
    f && f(null)
})