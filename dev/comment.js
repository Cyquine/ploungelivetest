'use strict';
liveComments.Comment = function(data, opt_submitter) {
    this.id = data.id;
    this.submission = data.link_id.slice(3);
    this.created = 1000*data.created_utc;
    this.timestampTimeouts = {};
    if (!opt_submitter) {
        this.parentChain = data.parent_id[1] === '1' ?
                           [data.id, data.parent_id] : [data.id];
    }

    this.element = (function() {
        var loadParent = document.createElement('button');
        loadParent.className = 'parent loader';
        loadParent.onclick = this.fetchParent;

        var minimiser = document.createElement('button');
        minimiser.className = 'minimiser loader';
        minimiser.onclick = this.minimise;

        var loadChild = document.createElement('button');
        loadChild.className = 'child loader';
        loadParent.onclick = this.fetchChild;

        var permalink = document.createElement('a');
        permalink.className = 'permalink';
        permalink.target = '_blank';
        permalink.href = '//www.reddit.com/r/' + data.subreddit + '/comments/' +
                            data.link_id.slice(3) + '/x/' + data.id;

        var author;
        if (data.author === '[deleted]') {
            author = document.createElement('p');
            author.className = 'author';
        } else {
            author = document.createElement('a');
            author.href = '//www.reddit.com/u/' + data.author;
            author.target = '_blank';
            author.className = 'author' + (data.author === (opt_submitter ||
                                data.link_author) ? ' submitter' : '');
        }
        author.appendChild(document.createTextNode(data.author));

        var created = document.createElement('time'),
            createdTime = new Date(this.created);
        created.appendChild(document.createTextNode(''));
        created.className = 'created';
        created.datetime = createdTime.toISOString();
        created.title = createdTime.toString();

        var header = document.createElement('div');
        header.appendChild(loadParent);
        header.appendChild(minimiser);
        header.appendChild(loadChild);
        header.appendChild(permalink);
        header.appendChild(author);
        header.appendChild(created);
        header.className = 'comment-header';

        var md = document.createElement('div');
        md.innerHTML = data.body_html;
        md.innerHTML = md.firstChild.nodeValue;
        liveComments.bpm(md);
        md.className = 'md-wrapper';
        md.style.height = 'auto';

        var comment = document.createElement('div');
        comment.appendChild(header);
        comment.appendChild(md);
        comment.className = 'comment';

        return comment;
    }).apply(this);
}

liveComments.Comment.prototype.getCopy = function() {
    var copyNo = -1;
    while (this.timestampTimeouts[++copyNo] !== undefined) ;

    var el = this.element;
    if (el.id) {
        el = el.cloneNode(true);
        var header = el.firstChild;
        header.firstChild.onclick = this.fetchParent;
        header.childNodes[1].onclick = this.minimise;
        header.childNodes[2].onclick = this.fetchChild;
    }

    el.id = this.id + '-' + copyNo;
    this.timestampTimeouts[copyNo] = null;
    return el;
}

liveComments.Comment.prototype.fetchParent = function(event) {
    var that = liveComments.loadedComments[this.parentNode.parentNode.id];
    liveComments.load(event, function() {
        console.log(that);
    // var root = el.parentNode.parentNode;

    // if (!this.parent) {
    //     this.element.className = 'comment shifted-right';
    // } else if (liveComments.loadedComments[this.parent]) {
    //     moveEls();
    // } else {

    // }
    });
}

liveComments.Comment.prototype.createSubmission = function() {
    var submission = liveComments.loadedSubmissions[this.submission].getCopy(this.id);
    submission.lastChild.appendChild(this.getCopy());
    return submission;
}

liveComments.Comment.prototype.minimise = function(event) {
    event.preventDefault();
    var el = event.target;
    el.disabled = true;
    el.classList.toggle('minimiser');

    var md = event.target.parentNode.nextSibling;
    if (el.classList.contains('minimiser')) {
        md.style.height = md.scrollHeight + 'px';
    } else {
        if (md.style.height === 'auto') {
            md.style.height = md.offsetHeight + 'px';
            md.offsetHeight; // forces reflow
        }
        md.style.height = '';
    }

    el.disabled = false;
}

liveComments.Comment.prototype.show = function(el) {
    this.setTimestamp(el);
}

liveComments.Comment.prototype.hide = function(el) {
    var copyNo = el.id.split('-', 2)[1];
    clearTimeout(this.timestampTimeouts[copyNo]);
}

liveComments.Comment.prototype.removeCopy = function(el) {
    this.hide(el);
    el.parentNode.removeChild(el);

    var copyNo = el.id.split('-', 2)[1];
    this.timestampTimeouts[copyNo] = null;
}

liveComments.Comment.prototype.setTimestamp = function(el) {
    function modDiv(a, b) {return (a-a%b)/b}

    var copyNo = el.id.split('-', 2)[1],
        age = Date.now() - this.created,
        value, unit, waitUnit;
    if (value = modDiv(age, 86400000)) { // assignments intended
        unit = ' day';
        waitUnit = 86400000;
    } else if (value = modDiv(age, 3600000)) {
        unit = ' hour';
        waitUnit = 360000;
    } else if (value = modDiv(age, 60000)) {
        unit = ' minute';
        waitUnit = 60000;
    } else {
        el.firstChild.childNodes[5].firstChild.nodeValue = 'just now';
        this.timestampTimeouts[copyNo] = setTimeout(this.setTimestamp.bind(this,
                                                              el), 60000 - age);
        return;
    }
    el.firstChild.childNodes[5].firstChild.nodeValue = value + unit +
                                              (value === 1 ? '' : 's') + ' ago';
    this.timestampTimeouts[copyNo] = setTimeout(this.setTimestamp.bind(this, el),
                                                    (value + 1)*waitUnit - age);
}