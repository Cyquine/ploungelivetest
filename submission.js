'use strict';
liveComments.Submission = function(data) {
    // data from comment has link attributes prefixed with 'link_'
    var prefix = data.name[1] === '1' ? 'link_' : '';

    var loader = document.createElement('button');
    loader.className = 'loader';
    loader.onclick = this.fetch;

    var title = document.createElement('a');
    title.innerHTML = data[prefix + 'title'];
    liveComments.bpm(title);
    title.href = data[prefix + 'url'];
    title.target = '_blank';

    var author;
    if (data[prefix + 'author'] === '[deleted]') {
        author = document.createElement('p');
        author.className = 'author';
    } else {
        author = document.createElement('a');
        author.className = 'author submitter';
        author.href ='//reddit.com/u/' + data[prefix + 'author'];
        author.target = '_blank';
    }
    author.appendChild(document.createTextNode(data[prefix + 'author']));

    var subreddit = document.createElement('a');
    subreddit.appendChild(document.createTextNode('/r/' + data.subreddit));
    subreddit.href = '//reddit.com/r/' + data.subreddit;
    subreddit.target = '_blank';

    var link = document.createElement('p');
    link.appendChild(title);
    link.appendChild(document.createTextNode(' by '));
    link.appendChild(author);
    link.appendChild(document.createTextNode(' in '));
    link.appendChild(subreddit);
    link.className = 'link';

    var header = document.createElement('div');
    header.appendChild(loader);

    var id = prefix ? data.link_id.slice(3) : data.id;
    if (data.is_self === false || title.pathname.lastIndexOf('/r/' +
            data.subreddit + '/comments/' + id) !== 0) {
        var permalink = document.createElement('a');
        permalink.className = 'permalink';
        permalink.href = 'http://redd.it/' + id;
        permalink.target = '_blank';
        header.appendChild(permalink);
    }

    header.appendChild(link);
    header.className = 'submission-header';

    var comments = document.createElement('div');
    comments.className = 'comments';

    this.element = document.createElement('div');
    this.element.appendChild(header);
    this.element.appendChild(comments);
    this.element.className = 'submission';

    this.copies = [];
};

liveComments.Submission.prototype.getCopy = function(commentId) {
        // copies reference element with event listeners
    var el = this.element.cloneNode(true);
    el.firstChild.firstChild.onclick = this.fetch;

    this.copies.push(el);

    el.id = commentId;
    return el;
};

liveComments.Submission.prototype.makeDeleted = function() {
    function makeDeleted_(el) {
        el.firstChild.lastChild.childNodes[2].classList.add('deleted');
    }

    makeDeleted_(this.element);
    for (var i = 0; i < this.copies.length; i++) makeDeleted_(this.copies[i]);
}