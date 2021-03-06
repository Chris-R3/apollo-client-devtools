import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import pickBy from 'lodash/pickBy';
import sortBy from 'lodash/sortBy';
import classnames from 'classnames';
import { getQueryDefinition } from 'apollo-client';
import { parse } from 'graphql-tag/parser';
import { GraphqlCodeBlock } from 'graphql-syntax-highlighter-react';
import { Sidebar } from '../Sidebar';
import './WatchedQueries.less';

const queryNameFromQueryString = (queryString) => {
  const doc = parse(queryString);
  const queryDefinition = getQueryDefinition(doc);
  if (queryDefinition.name && queryDefinition.name.value) {
    return queryDefinition.name.value;
  }
  return null;
};

const queryLabel = (queryId, query) => {
  const queryName = queryNameFromQueryString(query.queryString);
  if (queryName === null) {
    return queryId;
  }
  return `${queryName}`;
};

class WatchedQueries extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      selectedId: null,
    };
  }

  componentDidMount() {
    if (ga) ga('send', 'pageview', 'WatchedQueries');
  }

  selectId(id) {
    this.setState({ selectedId: id });
  }

  getQueries() {
    return this.props.state ?
      pickBy(this.props.state.queries, query => !query.stopped) :
      {};
  }

  sortedQueryIds() {
    const queries = this.getQueries();
    return sortBy(Object.keys(queries), id => parseInt(id, 10));
  }

  renderSidebarItem(id, query) {
    let className = 'item';
    return (
      <li key={id} onClick={() => this.selectId(id)}
        className={classnames('item', {
          active: id === this.state.selectedId,
          loading: query.loading,
        })}>
        <span>{queryLabel(id, query)}</span>
      </li>
    );
  }

  render() {
    const queries = this.getQueries();
    const { selectedId } = this.state;
    return (
      <div className="watchedQueries body">
        <Sidebar className="sidebar" name="watched-queries-sidebar">
          <div className="queries-sidebar-title">Watched queries</div>
          <ol className="query-list">{this.sortedQueryIds().map(id => this.renderSidebarItem(id, queries[id]))}</ol>
        </Sidebar>
        {selectedId && queries[selectedId] &&
        <WatchedQuery queryId={selectedId} query={queries[selectedId]} onRun={this.props.onRun} />}
      </div>
    );
  }
}

WatchedQueries.propTypes = {
  state: PropTypes.object,
};

class LabeledShowHide extends React.Component {
  constructor(props, context) {
    super(props, context);
    const { show = true } = props;
    this.state = { show: true };
    this.toggle = this.toggle.bind(this);
  }
  toggle() {
    this.setState(({ show }) => ({ show: !show }));
  }
  render() {
    return (
      <div className={classnames(this.props.className, 'toggled-section')}>
        <span onClick={this.toggle} className="toggle">
          <span className={classnames('triangle', { toggled: !this.state.show })}>&#9662;</span>
          <span className="section-label">{this.props.label}</span>
        </span>
        {this.state.show &&
          <div className="labeled">{this.props.children}</div>}
      </div>
    );
  }
}
LabeledShowHide.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.any.isRequired,
  show: PropTypes.bool,
};

const Variables = ({variables} ) => {
  if (!variables) {
    return null;
  }
  const inner = [];
  Object.keys(variables).sort().forEach((name) => {
    inner.push(
      <tr>
        <td key={"dt"+name}>{ name }</td>
        <td key={"dd"+name}>{ JSON.stringify(variables[name]) }</td>
      </tr>
    );
  });
  return <table><tbody>{inner}</tbody></table>;
};

class WatchedQuery extends React.Component {
  render() {
    const { queryId, query } = this.props;
    const reactComponentDisplayName = query && query.metadata
            && query.metadata.reactComponent
            && query.metadata.reactComponent.displayName;
    return (
      <div className={classnames('main', {loading: query.loading})}>
        <div className="panel-title">
          { queryLabel(queryId, query) }
          {reactComponentDisplayName && <span className='component-name'>{`<${reactComponentDisplayName}>`}</span>}
          <span
            className="run-in-graphiql-link"
            onClick={() => this.props.onRun(query.queryString, query.variables)}
          >Run in GraphiQL</span>
        <span className={classnames('loading-label', { show: query.loading })}>(loading)</span>
        </div>
        {
          query.variables &&
          <LabeledShowHide label="Variables">
            <Variables variables={query.variables} />
          </LabeledShowHide>
        }
        <LabeledShowHide label="Query string" show={false}>
            <GraphqlCodeBlock className="GraphqlCodeBlock" queryBody={query.queryString} />
        </LabeledShowHide>
      </div>
    );
  }
}

export default WatchedQueries;
