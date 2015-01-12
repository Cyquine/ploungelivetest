function div(a, b) {return (a-a%b)/b} // integer division

function timestamp(el, created) { // sets live timestamp, then sleeps again
    var age = Date.now() - created;

    var value;
    if (value = div(age, 86400000)) { // assignments intended
        el.nodeValue = value + ' day' + (value === 1 ? '' : 's') + ' ago';
        setTimeout(timestamp, (value+1)*86400000 - age, el, created);
    } else if (value = div(age, 3600000)) {
        el.nodeValue = value + ' hour' + (value === 1 ? '' : 's') + ' ago';
        setTimeout(timestamp, (value+1)*360000 - age, el, created);
    } else if (value = div(age, 60000)) {
        el.nodeValue = value + ' minute' + (value === 1 ? '' : 's') + ' ago';
        setTimeout(timestamp, (value+1)*60000 - age, el, created);
    } else {
        el.nodeValue = 'just now';
        setTimeout(timestamp, 60000 - age, el, created);
    }    
}

function add_loader(el) {
    ['tl', 'tr', 'br', 'bl'].forEach(function(which) {
        var segment = document.createElement('span');
        segment.className = 'load-segment load-' + which;
        el.appendChild(segment);
    });
}

function show() {
    var wrapper = document.getElementById('content');
    for (var i = 0, to_hide = Math.min(show.hidden.length, 25); i < to_hide;
        i++) wrapper.appendChild(show.hidden.shift());

    var show_button = document.getElementById('show'),
        hidden_comments = document.getElementById('hidden-comments'),
        hide_button = document.getElementById('hide'),
        hidden = show.hidden.length;

    if (hidden === 0) {
        show_button.className = 'faded-out';
        hidden_comments.textContent = 'No hidden comments';
    } else {
        show_button.textContent = 'Show ' + Math.min(hidden, 25);
        hidden_comments.textContent = hidden + ' hidden comment' + (hidden > 1 ? 's' : '');
    }

    hide_button.textContent = 'Hide ' + Math.min(wrapper.children.length, 25);
    hide_button.className = 'faded-in';
    
}
show.hidden = [];

function hide() {
    var wrapper = document.getElementById('content');
    for (var i = 0, to_hide = Math.min(wrapper.children.length, 25);
            i < to_hide; i++) {
        var comment = wrapper.lastChild;
        wrapper.removeChild(comment);
        show.hidden.unshift(comment);
    }

    var show_button = document.getElementById('show'),
        hide_button = document.getElementById('hide'),
        hidden = show.hidden.length;

    show_button.textContent = 'Show ' + Math.min(hidden, 25);
    show_button.className = 'faded-in';

    if (wrapper.children.length === 0) hide_button.className = 'faded-out';
    else hide_button.textContent = 'Hide ' + Math.min(wrapper.children.length, 25);

    document.getElementById('hidden-comments').textContent = hidden +
                                    ' hidden comment' + (hidden > 1 ? 's' : '');
}