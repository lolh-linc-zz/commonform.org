var formChange = require('./form-change');

var defaultForm = {
  summary: 'Click to Type',
  form: {content: ['Click to type']}
};

var defaultParagraph = 'Click to type';

module.exports = React.createClass({
  getDefaultProps: function() {
    return {
      form: true,
      above: true
    };
  },
  propTypes: {
    path: React.PropTypes.array.isRequired
  },
  onClick: function(event) {
    event.preventDefault();
    var newPath = JSON.parse(JSON.stringify(this.props.path));
    var last = newPath[newPath.length - 1];
    if (!this.props.above) {
      newPath[newPath.length - 1] = last + 1;
    }
    var newValue = this.props.form ?
      JSON.parse(JSON.stringify(defaultForm)) :
      defaultParagraph;
    formChange({
      type: 'insert',
      path: newPath,
      value: newValue
    });
  },
  render: function() {
    var form = this.props.form;
    var above = this.props.above;
    return React.DOM.li({href: '#'}, [
      React.DOM.a({
        href: '#',
        onClick: this.onClick
      }, [
        React.DOM.span({
          className: 'glyphicon glyphicon-menu-' +
            (above ? 'up' : 'down')
        }),
        ' Add a ' +
          (form ? 'Form' : 'Paragraph') + ' ' +
          (above ? 'Above' : 'Below')
      ])
    ]);
  }
});
