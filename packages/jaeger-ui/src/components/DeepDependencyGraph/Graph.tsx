// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { Component } from 'react';
import { DirectedGraph, LayoutManager } from '@jaegertracing/plexus';
import _map from 'lodash/map';
import { History as RouterHistory, Location } from 'history';
import queryString from 'query-string';

import GraphModel from '../../model/ddg/Graph';
import { encode } from '../../model/ddg/visibility-codec';

import { PathElem, TDdgModel } from '../../model/ddg/types';

type TProps = {
  history: RouterHistory;
  location: Location;
  ddgModel: TDdgModel;
  visKey?: string;
};

export default class Graph extends Component<TProps> {
  private graphModel: GraphModel;
  private layoutManager: LayoutManager;

  constructor(props: TProps) {
    super(props);
    const { ddgModel } = props;
    const { distanceToPathElems } = ddgModel;
    this.graphModel = new GraphModel({ ddgModel });
    this.layoutManager = new LayoutManager({ useDotEdges: true, splines: 'polyline' });

    // TODO: Discuss if this should be in a componentDidUpdate in case visKey is unset without this component
    // being re-mounted
    if (!this.props.visKey) {
      const indices = _map(
        ([] as PathElem[]).concat(
          distanceToPathElems.get(-2) || [],
          distanceToPathElems.get(-1) || [],
          distanceToPathElems.get(0) || [],
          distanceToPathElems.get(1) || [],
          distanceToPathElems.get(2) || []
        ),
        'visibilityIdx'
      );
      const visibilityKey = encode(indices);
      const readOnlyQueryParams = queryString.parse(this.props.location.search);
      const queryParams = Object.assign({}, readOnlyQueryParams, { visibilityKey });
      this.props.history.replace({
        ...this.props.location,
        search: `?${queryString.stringify(queryParams)}`,
      });
    }
  }

  render() {
    if (!this.props.visKey) {
      return <h1>Calculating Initial Graph</h1>;
    }
    const { edges, vertices } = this.graphModel.getVisible(this.props.visKey);

    return (
      <DirectedGraph
        minimap
        zoom
        arrowScaleDampener={0}
        minimapClassName="DeepDependencyGraph--miniMap"
        layoutManager={this.layoutManager}
        edges={edges}
        vertices={vertices}
      />
    );
  }
}
