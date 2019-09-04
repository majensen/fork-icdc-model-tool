<link rel='stylesheet' href="assets/style.css">
<link rel='stylesheet' href="https://unpkg.com/leaflet@1.5.1/dist/leaflet.css" integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ==" crossorigin="">
<script type="text/javascript" src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
<script type="text/javascript"  src="https://unpkg.com/leaflet@1.5.1/dist/leaflet.js"></script>
<script type="text/javascript" src="assets/actions.js"></script>

Zoom to Node: <select id="node_select">
  <option value="">Zoom to Node</option>
</select>
<div id="model"></div>

# MakeModel and model-tool

## Overview

The MakeModel "framework" takes a convenient, human-readable
description of an overall graph model, laid out in one or two YAML
files, and uses these to perform various functions that enable
tasks related to the ICDC data system.


The command-line tool `model-tool` takes the model description files (MDF)
as input, and performs the following tasks:

* Validates the content of the MDF for syntax and consistency
* Creates an SVG graphical representation of the model as specified; 
* Output a simple tab-delimited table of nodes and properties;
* _Coming Soon_: Outputs Cypher queries that can be used to create a representation
  of the model in a [Neo4j](https://neo4j.com) graph database.

## Installing `model-tool`

* MakeModel is written in Perl. If you don't have Perl,
[get it](https://www.perl.org/get.html). On Windows, I recommend
Strawberry Perl.

* Get [GraphViz](http://www.graphviz.org/) if you want to use the
graphic output feature.

* Clone this repo 

        git clone https://github.com/CBIIT/icdc-model-tools.git 

* Move to `make-model` directory 

        cd icdc-model-tools/make-model 

* Easy build:

  * Get the "cpanminus" tool:

        curl -L https://cpanmin.us | perl - App::cpanminus     # or
        wget -O - https://cpanmin.us | perl - App::cpanminus

  * Run cpanm to install

        cpanm .

    which will pull in all dependencies, run tests and install the
    script.

* Try it:

        model-tool

  and the Usage hints should display:

```
NCI-02133017-ML:icdc-model-tool jensenma$ make-model/bin/model-tool 
FATAL: Nothing to do!
 (2019/08/23 15:37:10 in main::)
Usage:
      model-tool [-g <graph-out-file>] [-s <output-dir>] [-j <json-out-file>] 
                 [-T <table-out-file>] <input.yaml> [<input2.yaml> ...]
         [-d dir_to_search [-d another_dir...]]
      -g : create an SVG of model defined in input.yamls
      -T : output a table of nodes and properties
      -a : output all nodes, including unlinked nodes
      -v : verbosity (-v little ... -vvvv lots)
      -W : show all warnings ( = -vvv )
      --dry-run : emit log msg, but no output files
```

## Docker version of model-tool

Rather than install the tool and its dependencies,
model-tool can be run using a Docker container,
[maj1/icdc:icdc-model-tool](https://cloud.docker.com/repository/docker/maj1/icdc/general).

[model-tool-d](https://github.com/CBIIT/icdc-model-tool-docker) is a
command-line tool that runs just like model-tool, but uses the Docker
container above under the hood. Check it out!

## Model Description Files (MDF)

The layout of nodes, relationships, node properties, and relationship
properties are specified in data structure expressed in YAML-formatted
"model description files".

The input format follows these general conventions, which are enforced
by a [JSONSchema](https://json-schema.org/understanding-json-schema/) [schema](./model-desc/mdf-schema.yaml):

* Special key names are capitalized; these are essentially directives
to ModelMaker;

* Custom names, such as names of nodes and properties, are all lower
case, with underscores replacing any spaces ("snakecase");

Input to `model-tool` can be a single YAML file, or multiple YAML
files. If multiple files are given, the data structures are merged, so
that, for example, nodes and relationships can be described in one
file, and property definitions can be provided in a separate file.
p
Collectively, the input YAMLs are called "model description
files" (MDF). 

### Nodes

The `Nodes` top-level key points to an object containing descriptions
of each node type in the model. Node descriptions look like:

    <nodename> :
        Category: <categoryname>
        UniqueKeys:
            - [ 'propnameA', 'propnameB', ... ]
            - [ ... ]
            - ...
        Props:
           - <propname1>
           - <propname2>
           - ...

A node type can have a defined category, or a default (which can be
configured) will be used in the final output.

The `UniqueKeys` key points to an array of arrays. Each bottom-level
array is a list (which can be of length 1) of node property
names. This specifies that nodes of this type that are created in the
system must be unique with respect to the set of values for the
properties indicated. For example, `['id']` here indicates that the
value for the property `id` must be unique for all nodes of the
type. `['project_id', 'submitter_id']` indicates that the submitter id
must be unique among all nodes having a given project_id value.

The `Props` key points to a simple array of property names given as
strings. The detailed definition of each property (e.g., value type or
enumeration, required status) are provided once, in a separate top-level
section, `PropDefinitions` ([see below](#Property Definitions)).

### Relationships

The `Relationships` top-level key points to an object of descriptions of
each relationship type. Relationship descriptions look like:

    <relname>:
         Props:
             - <propname>
         Req: [ true | false ]
         Mul: [ one_to_one | many_to_one | many_to_many | one_to_many ]
         Ends:
            - Src: <nodename1>
               Dst: <nodename2>
            - Src: <nodename...>
               ...

A named relationship can have properties defined, analogous to
nodes. However, the Gen3 "graph" doesn't support relationship
properties, so specifying these will not influence the output.

A named relationship can be specified as required with the `Req` key,
and its multiplicity (from source node type to destination node type)
with the `Mul` key.

A given named relationship can be formed between different source and
destination node type pairs. The `Ends` key points to an array of `{ Src, Dst }`
objects that describe the allowed pairs.

### Property Definitions

The `PropDefinitions` top-level key points to an object of
descriptions of each property. Property descriptions look like:

    <propname1>:
        Term: <term reference token>
        # e.g., for $ref: "_terms.yaml#/ajcc_clinical_m", 
        # use 'ajcc_clinical_m'
        Desc: "a description of the property"
        Type: <string|number> # or the following:
        Enum:
            - acceptable
            - values
            - for
            - property
            - go
            - here
        Nul: <true|false> # is property nullable?
        Req: <true|false> # is property required?
        Src: <a string describing where the property came from - e.g.
                 a CRF.>


Either the `Type` or the `Enum` key should be present. If Enum key is
present, the `Type` key will be ignored.

`Src` is a note regarding the data source of the property. The value
is not used in any output; it is essentially a comment.

Where properties need to be applied to Nodes and Relationships, use a
list of propnames from those defined in PropDefinitions.

### Multiple input YAML files and "overlays"

`model-tool` allows multiple input YAML files. The structured
information in the files are merged together to produce one
input structure internally. This allows a user to, for example,
keep Node definitions in one file, Relationships in another, and
Property definitions in yet another. Each of these objects has
a separate top-level key, and will be merged into the single
internal object without any "collisions".

Merging YAML files into a single object occurs with specific
rules that allow the user to "overlay" specific changes onto a
base model file, without having to resort to multiple versions
of a base model. The first pair of files is merged, the next file
is merged into that result, and so on to the end of the input files.
For example:

    model-tool -g graph.svg icdc-model.yml temp-changes.yml

would create a graphic of nodes and edges defined in `icdc-model.yml`,
as modified by changes specified in `temp-changes.yml`.

#### Adding elements

As indicated above, if independent sets of keys at a given
level of the YAML structure are present in the input files,
the merged structure will possess all the keys and their
contents:

File 1:
    Nodes:
      original_node:
        Props:
	      - old_prop

File 2:
    Nodes:
      original_node:
        Props:
          - new_prop
      addtional_node:
        Props:
          - new_prop

yields

    Nodes:
      original_node:
        Props:
          - old_prop
          - new_prop
      additional_node:
        Props:
          - new_prop

Note that by default, the overlay keys and values are added;
original array elements are not replaced. Array elements remain
unique: if both files have an element named `foo`, only one
`foo` element will be present in the merged array.

#### Deleting/replacing elements

To indicate that an overlay should remove a key and its contents,
or an array element, that are present in an earlier file, prefix the
key/element with a forward slash `/`

File 1:

    Nodes:
      original_node:
        Props:
          - unwanted_prop
          - a_prop
      unwanted_node:
        Props:
          - a_prop

File 2:
    Nodes:
      original_node:
        Props:
          - /unwanted_prop
          - new_prop
      /unwanted_node:
        Props:
          - whatever_prop

yields

    Nodes:
      original_node:
        Props:
          - a_prop
      - new_prop

#### Tagging Entities

A `Tags` entry can be added to any object (thing that accepts
key:value pairs) in the MDF. This is a way to associate
metainformation with an entity that can be read later by a custom
parser. A `Tags` entry value is an array of strings, the tags.

For example, one may markup a set of nodes to be rendered in a certain
color:

    dog:
      Props:
        - breed
      Tags:
        - "color: red;"
    cat:
      Props:
        - breed
      Tags:
        - "color: blue;"


## model-tool Outputs

### Graphic representation of the input model

`model-tool` can produce an SVG rendering of the input data
model. This requires that [GraphViz](http://www.graphviz.org/) be
installed on your system.

### Table of nodes and associated properties

`model-tool` can produce a simple table of node names and property
names, suitable for Excel etc.

    $ model-tool --table t.txt icdc-model.yaml  # content of t.txt is...
    ...
    adverse_event   day_in_cycle
    adverse_event   dose_limiting_toxicity
    adverse_event   unexpected_adverse_event
    agent   document_number
    agent   medication
    agent_administration    comment
    agent_administration    crf_idp
    ...

<div id='graph' style='display:off;'>
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 2.40.1 (20161225.0304)
 -->
<!-- Title: Perl Pages: 1 -->
<svg width="3746pt" height="2918pt"
 viewBox="0.00 0.00 3746.00 2918.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(4 2914)">
<title>Perl</title>
<polygon fill="#ffffff" stroke="transparent" points="-4,4 -4,-2914 3742,-2914 3742,4 -4,4"/>
<!-- diagnosis -->
<g id="node1" class="node">
<title>diagnosis</title>
<path fill="none" stroke="#000000" d="M1808,-1734.5C1808,-1734.5 2151,-1734.5 2151,-1734.5 2157,-1734.5 2163,-1740.5 2163,-1746.5 2163,-1746.5 2163,-2021.5 2163,-2021.5 2163,-2027.5 2157,-2033.5 2151,-2033.5 2151,-2033.5 1808,-2033.5 1808,-2033.5 1802,-2033.5 1796,-2027.5 1796,-2021.5 1796,-2021.5 1796,-1746.5 1796,-1746.5 1796,-1740.5 1802,-1734.5 1808,-1734.5"/>
<text text-anchor="middle" x="1838" y="-1880.3" font-family="Times,serif" font-size="14.00" fill="#000000">diagnosis</text>
<polyline fill="none" stroke="#000000" points="1880,-1734.5 1880,-2033.5 "/>
<text text-anchor="middle" x="1890.5" y="-1880.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1901,-1734.5 1901,-2033.5 "/>
<text text-anchor="middle" x="2021.5" y="-2018.3" font-family="Times,serif" font-size="14.00" fill="#000000">concurrent_disease</text>
<polyline fill="none" stroke="#000000" points="1901,-2010.5 2142,-2010.5 "/>
<text text-anchor="middle" x="2021.5" y="-1995.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_diagnosis</text>
<polyline fill="none" stroke="#000000" points="1901,-1987.5 2142,-1987.5 "/>
<text text-anchor="middle" x="2021.5" y="-1972.3" font-family="Times,serif" font-size="14.00" fill="#000000">pathology_report</text>
<polyline fill="none" stroke="#000000" points="1901,-1964.5 2142,-1964.5 "/>
<text text-anchor="middle" x="2021.5" y="-1949.3" font-family="Times,serif" font-size="14.00" fill="#000000">concurrent_disease_type</text>
<polyline fill="none" stroke="#000000" points="1901,-1941.5 2142,-1941.5 "/>
<text text-anchor="middle" x="2021.5" y="-1926.3" font-family="Times,serif" font-size="14.00" fill="#000000">primary_disease_site</text>
<polyline fill="none" stroke="#000000" points="1901,-1918.5 2142,-1918.5 "/>
<text text-anchor="middle" x="2021.5" y="-1903.3" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="1901,-1895.5 2142,-1895.5 "/>
<text text-anchor="middle" x="2021.5" y="-1880.3" font-family="Times,serif" font-size="14.00" fill="#000000">histology_cytopathology</text>
<polyline fill="none" stroke="#000000" points="1901,-1872.5 2142,-1872.5 "/>
<text text-anchor="middle" x="2021.5" y="-1857.3" font-family="Times,serif" font-size="14.00" fill="#000000">disease_term</text>
<polyline fill="none" stroke="#000000" points="1901,-1849.5 2142,-1849.5 "/>
<text text-anchor="middle" x="2021.5" y="-1834.3" font-family="Times,serif" font-size="14.00" fill="#000000">stage_of_disease</text>
<polyline fill="none" stroke="#000000" points="1901,-1826.5 2142,-1826.5 "/>
<text text-anchor="middle" x="2021.5" y="-1811.3" font-family="Times,serif" font-size="14.00" fill="#000000">histological_grade</text>
<polyline fill="none" stroke="#000000" points="1901,-1803.5 2142,-1803.5 "/>
<text text-anchor="middle" x="2021.5" y="-1788.3" font-family="Times,serif" font-size="14.00" fill="#000000">treatment_data</text>
<polyline fill="none" stroke="#000000" points="1901,-1780.5 2142,-1780.5 "/>
<text text-anchor="middle" x="2021.5" y="-1765.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_histology_confirmation</text>
<polyline fill="none" stroke="#000000" points="1901,-1757.5 2142,-1757.5 "/>
<text text-anchor="middle" x="2021.5" y="-1742.3" font-family="Times,serif" font-size="14.00" fill="#000000">follow_up_data</text>
<polyline fill="none" stroke="#000000" points="2142,-1734.5 2142,-2033.5 "/>
<text text-anchor="middle" x="2152.5" y="-1880.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- case -->
<g id="node16" class="node">
<title>case</title>
<path fill="none" stroke="#000000" d="M2136,-1157.5C2136,-1157.5 2355,-1157.5 2355,-1157.5 2361,-1157.5 2367,-1163.5 2367,-1169.5 2367,-1169.5 2367,-1237.5 2367,-1237.5 2367,-1243.5 2361,-1249.5 2355,-1249.5 2355,-1249.5 2136,-1249.5 2136,-1249.5 2130,-1249.5 2124,-1243.5 2124,-1237.5 2124,-1237.5 2124,-1169.5 2124,-1169.5 2124,-1163.5 2130,-1157.5 2136,-1157.5"/>
<text text-anchor="middle" x="2148.5" y="-1199.8" font-family="Times,serif" font-size="14.00" fill="#000000">case</text>
<polyline fill="none" stroke="#000000" points="2173,-1157.5 2173,-1249.5 "/>
<text text-anchor="middle" x="2183.5" y="-1199.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2194,-1157.5 2194,-1249.5 "/>
<text text-anchor="middle" x="2270" y="-1234.3" font-family="Times,serif" font-size="14.00" fill="#000000">case_id</text>
<polyline fill="none" stroke="#000000" points="2194,-1226.5 2346,-1226.5 "/>
<text text-anchor="middle" x="2270" y="-1211.3" font-family="Times,serif" font-size="14.00" fill="#000000">patient_first_name</text>
<polyline fill="none" stroke="#000000" points="2194,-1203.5 2346,-1203.5 "/>
<text text-anchor="middle" x="2270" y="-1188.3" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="2194,-1180.5 2346,-1180.5 "/>
<text text-anchor="middle" x="2270" y="-1165.3" font-family="Times,serif" font-size="14.00" fill="#000000">patient_id</text>
<polyline fill="none" stroke="#000000" points="2346,-1157.5 2346,-1249.5 "/>
<text text-anchor="middle" x="2356.5" y="-1199.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- diagnosis&#45;&gt;case -->
<g id="edge7" class="edge">
<title>diagnosis&#45;&gt;case</title>
<path fill="none" stroke="#000000" d="M1941.1347,-1734.2722C1917.8085,-1607.3014 1907.2951,-1426.3487 1995.5,-1301 2010.7695,-1279.3004 2061.948,-1257.6077 2114.056,-1240.212"/>
<polygon fill="#000000" stroke="#000000" points="2115.3801,-1243.4612 2123.7881,-1237.0149 2113.1952,-1236.8109 2115.3801,-1243.4612"/>
<text text-anchor="middle" x="2022.5" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_case</text>
</g>
<!-- off_study -->
<g id="node2" class="node">
<title>off_study</title>
<path fill="none" stroke="#000000" d="M2291,-760.5C2291,-760.5 2706,-760.5 2706,-760.5 2712,-760.5 2718,-766.5 2718,-772.5 2718,-772.5 2718,-955.5 2718,-955.5 2718,-961.5 2712,-967.5 2706,-967.5 2706,-967.5 2291,-967.5 2291,-967.5 2285,-967.5 2279,-961.5 2279,-955.5 2279,-955.5 2279,-772.5 2279,-772.5 2279,-766.5 2285,-760.5 2291,-760.5"/>
<text text-anchor="middle" x="2320.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">off_study</text>
<polyline fill="none" stroke="#000000" points="2362,-760.5 2362,-967.5 "/>
<text text-anchor="middle" x="2372.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2383,-760.5 2383,-967.5 "/>
<text text-anchor="middle" x="2540" y="-952.3" font-family="Times,serif" font-size="14.00" fill="#000000">best_resp_vet_tx_tp_secondary_response</text>
<polyline fill="none" stroke="#000000" points="2383,-944.5 2697,-944.5 "/>
<text text-anchor="middle" x="2540" y="-929.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_last_medication_administration</text>
<polyline fill="none" stroke="#000000" points="2383,-921.5 2697,-921.5 "/>
<text text-anchor="middle" x="2540" y="-906.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_best_response</text>
<polyline fill="none" stroke="#000000" points="2383,-898.5 2697,-898.5 "/>
<text text-anchor="middle" x="2540" y="-883.3" font-family="Times,serif" font-size="14.00" fill="#000000">document_number</text>
<polyline fill="none" stroke="#000000" points="2383,-875.5 2697,-875.5 "/>
<text text-anchor="middle" x="2540" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_disease_progression</text>
<polyline fill="none" stroke="#000000" points="2383,-852.5 2697,-852.5 "/>
<text text-anchor="middle" x="2540" y="-837.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_off_study</text>
<polyline fill="none" stroke="#000000" points="2383,-829.5 2697,-829.5 "/>
<text text-anchor="middle" x="2540" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_off_treatment</text>
<polyline fill="none" stroke="#000000" points="2383,-806.5 2697,-806.5 "/>
<text text-anchor="middle" x="2540" y="-791.3" font-family="Times,serif" font-size="14.00" fill="#000000">best_resp_vet_tx_tp_best_response</text>
<polyline fill="none" stroke="#000000" points="2383,-783.5 2697,-783.5 "/>
<text text-anchor="middle" x="2540" y="-768.3" font-family="Times,serif" font-size="14.00" fill="#000000">reason_off_study</text>
<polyline fill="none" stroke="#000000" points="2697,-760.5 2697,-967.5 "/>
<text text-anchor="middle" x="2707.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- physical_exam -->
<g id="node3" class="node">
<title>physical_exam</title>
<path fill="none" stroke="#000000" d="M3003.5,-2259.5C3003.5,-2259.5 3319.5,-2259.5 3319.5,-2259.5 3325.5,-2259.5 3331.5,-2265.5 3331.5,-2271.5 3331.5,-2271.5 3331.5,-2431.5 3331.5,-2431.5 3331.5,-2437.5 3325.5,-2443.5 3319.5,-2443.5 3319.5,-2443.5 3003.5,-2443.5 3003.5,-2443.5 2997.5,-2443.5 2991.5,-2437.5 2991.5,-2431.5 2991.5,-2431.5 2991.5,-2271.5 2991.5,-2271.5 2991.5,-2265.5 2997.5,-2259.5 3003.5,-2259.5"/>
<text text-anchor="middle" x="3052.5" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000">physical_exam</text>
<polyline fill="none" stroke="#000000" points="3113.5,-2259.5 3113.5,-2443.5 "/>
<text text-anchor="middle" x="3124" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="3134.5,-2259.5 3134.5,-2443.5 "/>
<text text-anchor="middle" x="3222.5" y="-2428.3" font-family="Times,serif" font-size="14.00" fill="#000000">pe_finding</text>
<polyline fill="none" stroke="#000000" points="3134.5,-2420.5 3310.5,-2420.5 "/>
<text text-anchor="middle" x="3222.5" y="-2405.3" font-family="Times,serif" font-size="14.00" fill="#000000">assessment_timepoint</text>
<polyline fill="none" stroke="#000000" points="3134.5,-2397.5 3310.5,-2397.5 "/>
<text text-anchor="middle" x="3222.5" y="-2382.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_examination</text>
<polyline fill="none" stroke="#000000" points="3134.5,-2374.5 3310.5,-2374.5 "/>
<text text-anchor="middle" x="3222.5" y="-2359.3" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="3134.5,-2351.5 3310.5,-2351.5 "/>
<text text-anchor="middle" x="3222.5" y="-2336.3" font-family="Times,serif" font-size="14.00" fill="#000000">phase_pe</text>
<polyline fill="none" stroke="#000000" points="3134.5,-2328.5 3310.5,-2328.5 "/>
<text text-anchor="middle" x="3222.5" y="-2313.3" font-family="Times,serif" font-size="14.00" fill="#000000">body_system</text>
<polyline fill="none" stroke="#000000" points="3134.5,-2305.5 3310.5,-2305.5 "/>
<text text-anchor="middle" x="3222.5" y="-2290.3" font-family="Times,serif" font-size="14.00" fill="#000000">day_in_cycle</text>
<polyline fill="none" stroke="#000000" points="3134.5,-2282.5 3310.5,-2282.5 "/>
<text text-anchor="middle" x="3222.5" y="-2267.3" font-family="Times,serif" font-size="14.00" fill="#000000">pe_comment</text>
<polyline fill="none" stroke="#000000" points="3310.5,-2259.5 3310.5,-2443.5 "/>
<text text-anchor="middle" x="3321" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- enrollment -->
<g id="node20" class="node">
<title>enrollment</title>
<path fill="none" stroke="#000000" d="M2071,-1405C2071,-1405 2420,-1405 2420,-1405 2426,-1405 2432,-1411 2432,-1417 2432,-1417 2432,-1600 2432,-1600 2432,-1606 2426,-1612 2420,-1612 2420,-1612 2071,-1612 2071,-1612 2065,-1612 2059,-1606 2059,-1600 2059,-1600 2059,-1417 2059,-1417 2059,-1411 2065,-1405 2071,-1405"/>
<text text-anchor="middle" x="2106.5" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000">enrollment</text>
<polyline fill="none" stroke="#000000" points="2154,-1405 2154,-1612 "/>
<text text-anchor="middle" x="2164.5" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2175,-1405 2175,-1612 "/>
<text text-anchor="middle" x="2293" y="-1596.8" font-family="Times,serif" font-size="14.00" fill="#000000">initials</text>
<polyline fill="none" stroke="#000000" points="2175,-1589 2411,-1589 "/>
<text text-anchor="middle" x="2293" y="-1573.8" font-family="Times,serif" font-size="14.00" fill="#000000">veterinary_medical_center</text>
<polyline fill="none" stroke="#000000" points="2175,-1566 2411,-1566 "/>
<text text-anchor="middle" x="2293" y="-1550.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_registration</text>
<polyline fill="none" stroke="#000000" points="2175,-1543 2411,-1543 "/>
<text text-anchor="middle" x="2293" y="-1527.8" font-family="Times,serif" font-size="14.00" fill="#000000">patient_subgroup</text>
<polyline fill="none" stroke="#000000" points="2175,-1520 2411,-1520 "/>
<text text-anchor="middle" x="2293" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000">site_short_name</text>
<polyline fill="none" stroke="#000000" points="2175,-1497 2411,-1497 "/>
<text text-anchor="middle" x="2293" y="-1481.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_informed_consent</text>
<polyline fill="none" stroke="#000000" points="2175,-1474 2411,-1474 "/>
<text text-anchor="middle" x="2293" y="-1458.8" font-family="Times,serif" font-size="14.00" fill="#000000">cohort_description</text>
<polyline fill="none" stroke="#000000" points="2175,-1451 2411,-1451 "/>
<text text-anchor="middle" x="2293" y="-1435.8" font-family="Times,serif" font-size="14.00" fill="#000000">enrollment_document_number</text>
<polyline fill="none" stroke="#000000" points="2175,-1428 2411,-1428 "/>
<text text-anchor="middle" x="2293" y="-1412.8" font-family="Times,serif" font-size="14.00" fill="#000000">registering_institution</text>
<polyline fill="none" stroke="#000000" points="2411,-1405 2411,-1612 "/>
<text text-anchor="middle" x="2421.5" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- physical_exam&#45;&gt;enrollment -->
<g id="edge32" class="edge">
<title>physical_exam&#45;&gt;enrollment</title>
<path fill="none" stroke="#000000" d="M3114.6078,-2259.3807C3081.4424,-2197.9992 3033.8772,-2116.9795 2982.5,-2052 2856.7664,-1892.9781 2839.9644,-1818.0819 2655.5,-1734 2568.6499,-1694.4123 2527.4904,-1757.4218 2441.5,-1716 2396.1729,-1694.1658 2355.9705,-1657.0131 2323.9572,-1620.1267"/>
<polygon fill="#000000" stroke="#000000" points="2326.4039,-1617.6019 2317.2513,-1612.2651 2321.0782,-1622.1447 2326.4039,-1617.6019"/>
<text text-anchor="middle" x="3017.5" y="-1880.3" font-family="Times,serif" font-size="14.00" fill="#000000">at_enrollment</text>
</g>
<!-- visit -->
<g id="node24" class="node">
<title>visit</title>
<path fill="none" stroke="#000000" d="M1888,-524.5C1888,-524.5 2063,-524.5 2063,-524.5 2069,-524.5 2075,-530.5 2075,-536.5 2075,-536.5 2075,-558.5 2075,-558.5 2075,-564.5 2069,-570.5 2063,-570.5 2063,-570.5 1888,-570.5 1888,-570.5 1882,-570.5 1876,-564.5 1876,-558.5 1876,-558.5 1876,-536.5 1876,-536.5 1876,-530.5 1882,-524.5 1888,-524.5"/>
<text text-anchor="middle" x="1899.5" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000">visit</text>
<polyline fill="none" stroke="#000000" points="1923,-524.5 1923,-570.5 "/>
<text text-anchor="middle" x="1933.5" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1944,-524.5 1944,-570.5 "/>
<text text-anchor="middle" x="1999" y="-555.3" font-family="Times,serif" font-size="14.00" fill="#000000">visit_date</text>
<polyline fill="none" stroke="#000000" points="1944,-547.5 2054,-547.5 "/>
<text text-anchor="middle" x="1999" y="-532.3" font-family="Times,serif" font-size="14.00" fill="#000000">visit_number</text>
<polyline fill="none" stroke="#000000" points="2054,-524.5 2054,-570.5 "/>
<text text-anchor="middle" x="2064.5" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- physical_exam&#45;&gt;visit -->
<g id="edge35" class="edge">
<title>physical_exam&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M3168.0024,-2259.412C3192.2258,-1909.8916 3272.9943,-681.9875 3216.5,-622 3178.0082,-581.1281 2382.0919,-557.4768 2085.5617,-550.0563"/>
<polygon fill="#000000" stroke="#000000" points="2085.31,-546.5491 2075.226,-549.7992 2085.1358,-553.5469 2085.31,-546.5491"/>
<text text-anchor="middle" x="3257.5" y="-1199.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
<!-- study_site -->
<g id="node4" class="node">
<title>study_site</title>
<path fill="none" stroke="#000000" d="M12,-403.5C12,-403.5 329,-403.5 329,-403.5 335,-403.5 341,-409.5 341,-415.5 341,-415.5 341,-460.5 341,-460.5 341,-466.5 335,-472.5 329,-472.5 329,-472.5 12,-472.5 12,-472.5 6,-472.5 0,-466.5 0,-460.5 0,-460.5 0,-415.5 0,-415.5 0,-409.5 6,-403.5 12,-403.5"/>
<text text-anchor="middle" x="45" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">study_site</text>
<polyline fill="none" stroke="#000000" points="90,-403.5 90,-472.5 "/>
<text text-anchor="middle" x="100.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="111,-403.5 111,-472.5 "/>
<text text-anchor="middle" x="215.5" y="-457.3" font-family="Times,serif" font-size="14.00" fill="#000000">veterinary_medical_center</text>
<polyline fill="none" stroke="#000000" points="111,-449.5 320,-449.5 "/>
<text text-anchor="middle" x="215.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">site_short_name</text>
<polyline fill="none" stroke="#000000" points="111,-426.5 320,-426.5 "/>
<text text-anchor="middle" x="215.5" y="-411.3" font-family="Times,serif" font-size="14.00" fill="#000000">registering_institution</text>
<polyline fill="none" stroke="#000000" points="320,-403.5 320,-472.5 "/>
<text text-anchor="middle" x="330.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- study -->
<g id="node11" class="node">
<title>study</title>
<path fill="none" stroke="#000000" d="M275.5,-190.5C275.5,-190.5 555.5,-190.5 555.5,-190.5 561.5,-190.5 567.5,-196.5 567.5,-202.5 567.5,-202.5 567.5,-339.5 567.5,-339.5 567.5,-345.5 561.5,-351.5 555.5,-351.5 555.5,-351.5 275.5,-351.5 275.5,-351.5 269.5,-351.5 263.5,-345.5 263.5,-339.5 263.5,-339.5 263.5,-202.5 263.5,-202.5 263.5,-196.5 269.5,-190.5 275.5,-190.5"/>
<text text-anchor="middle" x="291.5" y="-267.3" font-family="Times,serif" font-size="14.00" fill="#000000">study</text>
<polyline fill="none" stroke="#000000" points="319.5,-190.5 319.5,-351.5 "/>
<text text-anchor="middle" x="330" y="-267.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="340.5,-190.5 340.5,-351.5 "/>
<text text-anchor="middle" x="443.5" y="-336.3" font-family="Times,serif" font-size="14.00" fill="#000000">clinical_study_description</text>
<polyline fill="none" stroke="#000000" points="340.5,-328.5 546.5,-328.5 "/>
<text text-anchor="middle" x="443.5" y="-313.3" font-family="Times,serif" font-size="14.00" fill="#000000">clinical_study_designation</text>
<polyline fill="none" stroke="#000000" points="340.5,-305.5 546.5,-305.5 "/>
<text text-anchor="middle" x="443.5" y="-290.3" font-family="Times,serif" font-size="14.00" fill="#000000">dates_of_conduct</text>
<polyline fill="none" stroke="#000000" points="340.5,-282.5 546.5,-282.5 "/>
<text text-anchor="middle" x="443.5" y="-267.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_iacuc_approval</text>
<polyline fill="none" stroke="#000000" points="340.5,-259.5 546.5,-259.5 "/>
<text text-anchor="middle" x="443.5" y="-244.3" font-family="Times,serif" font-size="14.00" fill="#000000">clinical_study_name</text>
<polyline fill="none" stroke="#000000" points="340.5,-236.5 546.5,-236.5 "/>
<text text-anchor="middle" x="443.5" y="-221.3" font-family="Times,serif" font-size="14.00" fill="#000000">clinical_study_type</text>
<polyline fill="none" stroke="#000000" points="340.5,-213.5 546.5,-213.5 "/>
<text text-anchor="middle" x="443.5" y="-198.3" font-family="Times,serif" font-size="14.00" fill="#000000">clinical_study_id</text>
<polyline fill="none" stroke="#000000" points="546.5,-190.5 546.5,-351.5 "/>
<text text-anchor="middle" x="557" y="-267.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- study_site&#45;&gt;study -->
<g id="edge3" class="edge">
<title>study_site&#45;&gt;study</title>
<path fill="none" stroke="#000000" d="M221.2642,-403.3975C241.1365,-389.8518 264.8977,-373.6554 288.87,-357.3151"/>
<polygon fill="#000000" stroke="#000000" points="291.0604,-360.0579 297.3521,-351.5335 287.1178,-354.2738 291.0604,-360.0579"/>
<text text-anchor="middle" x="295" y="-373.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_study</text>
</g>
<!-- vital_signs -->
<g id="node5" class="node">
<title>vital_signs</title>
<path fill="none" stroke="#000000" d="M3337,-703C3337,-703 3624,-703 3624,-703 3630,-703 3636,-709 3636,-715 3636,-715 3636,-1013 3636,-1013 3636,-1019 3630,-1025 3624,-1025 3624,-1025 3337,-1025 3337,-1025 3331,-1025 3325,-1019 3325,-1013 3325,-1013 3325,-715 3325,-715 3325,-709 3331,-703 3337,-703"/>
<text text-anchor="middle" x="3371.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">vital_signs</text>
<polyline fill="none" stroke="#000000" points="3418,-703 3418,-1025 "/>
<text text-anchor="middle" x="3428.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="3439,-703 3439,-1025 "/>
<text text-anchor="middle" x="3527" y="-1009.8" font-family="Times,serif" font-size="14.00" fill="#000000">body_temperature</text>
<polyline fill="none" stroke="#000000" points="3439,-1002 3615,-1002 "/>
<text text-anchor="middle" x="3527" y="-986.8" font-family="Times,serif" font-size="14.00" fill="#000000">respiration_rate</text>
<polyline fill="none" stroke="#000000" points="3439,-979 3615,-979 "/>
<text text-anchor="middle" x="3527" y="-963.8" font-family="Times,serif" font-size="14.00" fill="#000000">respiration_pattern</text>
<polyline fill="none" stroke="#000000" points="3439,-956 3615,-956 "/>
<text text-anchor="middle" x="3527" y="-940.8" font-family="Times,serif" font-size="14.00" fill="#000000">phase</text>
<polyline fill="none" stroke="#000000" points="3439,-933 3615,-933 "/>
<text text-anchor="middle" x="3527" y="-917.8" font-family="Times,serif" font-size="14.00" fill="#000000">systolic_bp</text>
<polyline fill="none" stroke="#000000" points="3439,-910 3615,-910 "/>
<text text-anchor="middle" x="3527" y="-894.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_vital_signs</text>
<polyline fill="none" stroke="#000000" points="3439,-887 3615,-887 "/>
<text text-anchor="middle" x="3527" y="-871.8" font-family="Times,serif" font-size="14.00" fill="#000000">ecg</text>
<polyline fill="none" stroke="#000000" points="3439,-864 3615,-864 "/>
<text text-anchor="middle" x="3527" y="-848.8" font-family="Times,serif" font-size="14.00" fill="#000000">body_surface_area</text>
<polyline fill="none" stroke="#000000" points="3439,-841 3615,-841 "/>
<text text-anchor="middle" x="3527" y="-825.8" font-family="Times,serif" font-size="14.00" fill="#000000">assessment_timepoint</text>
<polyline fill="none" stroke="#000000" points="3439,-818 3615,-818 "/>
<text text-anchor="middle" x="3527" y="-802.8" font-family="Times,serif" font-size="14.00" fill="#000000">modified_ecog</text>
<polyline fill="none" stroke="#000000" points="3439,-795 3615,-795 "/>
<text text-anchor="middle" x="3527" y="-779.8" font-family="Times,serif" font-size="14.00" fill="#000000">patient_weight</text>
<polyline fill="none" stroke="#000000" points="3439,-772 3615,-772 "/>
<text text-anchor="middle" x="3527" y="-756.8" font-family="Times,serif" font-size="14.00" fill="#000000">pulse_ox</text>
<polyline fill="none" stroke="#000000" points="3439,-749 3615,-749 "/>
<text text-anchor="middle" x="3527" y="-733.8" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="3439,-726 3615,-726 "/>
<text text-anchor="middle" x="3527" y="-710.8" font-family="Times,serif" font-size="14.00" fill="#000000">pulse</text>
<polyline fill="none" stroke="#000000" points="3615,-703 3615,-1025 "/>
<text text-anchor="middle" x="3625.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- vital_signs&#45;&gt;visit -->
<g id="edge39" class="edge">
<title>vital_signs&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M3416.2617,-702.9194C3390.2995,-658.3246 3355.5721,-615.0522 3310.5,-589 3257.8654,-558.5765 2395.34,-550.1479 2085.3549,-548.0953"/>
<polygon fill="#000000" stroke="#000000" points="2085.0309,-544.5932 2075.0083,-548.0278 2084.9852,-551.593 2085.0309,-544.5932"/>
<text text-anchor="middle" x="3359.5" y="-592.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
<!-- agent_administration -->
<g id="node6" class="node">
<title>agent_administration</title>
<path fill="none" stroke="#000000" d="M832,-622.5C832,-622.5 1301,-622.5 1301,-622.5 1307,-622.5 1313,-628.5 1313,-634.5 1313,-634.5 1313,-1093.5 1313,-1093.5 1313,-1099.5 1307,-1105.5 1301,-1105.5 1301,-1105.5 832,-1105.5 832,-1105.5 826,-1105.5 820,-1099.5 820,-1093.5 820,-1093.5 820,-634.5 820,-634.5 820,-628.5 826,-622.5 832,-622.5"/>
<text text-anchor="middle" x="905" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">agent_administration</text>
<polyline fill="none" stroke="#000000" points="990,-622.5 990,-1105.5 "/>
<text text-anchor="middle" x="1000.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1011,-622.5 1011,-1105.5 "/>
<text text-anchor="middle" x="1151.5" y="-1090.3" font-family="Times,serif" font-size="14.00" fill="#000000">comment</text>
<polyline fill="none" stroke="#000000" points="1011,-1082.5 1292,-1082.5 "/>
<text text-anchor="middle" x="1151.5" y="-1067.3" font-family="Times,serif" font-size="14.00" fill="#000000">start_time</text>
<polyline fill="none" stroke="#000000" points="1011,-1059.5 1292,-1059.5 "/>
<text text-anchor="middle" x="1151.5" y="-1044.3" font-family="Times,serif" font-size="14.00" fill="#000000">stop_time</text>
<polyline fill="none" stroke="#000000" points="1011,-1036.5 1292,-1036.5 "/>
<text text-anchor="middle" x="1151.5" y="-1021.3" font-family="Times,serif" font-size="14.00" fill="#000000">phase</text>
<polyline fill="none" stroke="#000000" points="1011,-1013.5 1292,-1013.5 "/>
<text text-anchor="middle" x="1151.5" y="-998.3" font-family="Times,serif" font-size="14.00" fill="#000000">document_number</text>
<polyline fill="none" stroke="#000000" points="1011,-990.5 1292,-990.5 "/>
<text text-anchor="middle" x="1151.5" y="-975.3" font-family="Times,serif" font-size="14.00" fill="#000000">dose_units_of_measure</text>
<polyline fill="none" stroke="#000000" points="1011,-967.5 1292,-967.5 "/>
<text text-anchor="middle" x="1151.5" y="-952.3" font-family="Times,serif" font-size="14.00" fill="#000000">medication_actual_units_of_measure</text>
<polyline fill="none" stroke="#000000" points="1011,-944.5 1292,-944.5 "/>
<text text-anchor="middle" x="1151.5" y="-929.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_missed_dose</text>
<polyline fill="none" stroke="#000000" points="1011,-921.5 1292,-921.5 "/>
<text text-anchor="middle" x="1151.5" y="-906.3" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="1011,-898.5 1292,-898.5 "/>
<text text-anchor="middle" x="1151.5" y="-883.3" font-family="Times,serif" font-size="14.00" fill="#000000">medication_missed_dose</text>
<polyline fill="none" stroke="#000000" points="1011,-875.5 1292,-875.5 "/>
<text text-anchor="middle" x="1151.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">medication</text>
<polyline fill="none" stroke="#000000" points="1011,-852.5 1292,-852.5 "/>
<text text-anchor="middle" x="1151.5" y="-837.3" font-family="Times,serif" font-size="14.00" fill="#000000">dose_level</text>
<polyline fill="none" stroke="#000000" points="1011,-829.5 1292,-829.5 "/>
<text text-anchor="middle" x="1151.5" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000">route_of_administration</text>
<polyline fill="none" stroke="#000000" points="1011,-806.5 1292,-806.5 "/>
<text text-anchor="middle" x="1151.5" y="-791.3" font-family="Times,serif" font-size="14.00" fill="#000000">medication_vial_id</text>
<polyline fill="none" stroke="#000000" points="1011,-783.5 1292,-783.5 "/>
<text text-anchor="middle" x="1151.5" y="-768.3" font-family="Times,serif" font-size="14.00" fill="#000000">missed_dose_units_of_measure</text>
<polyline fill="none" stroke="#000000" points="1011,-760.5 1292,-760.5 "/>
<text text-anchor="middle" x="1151.5" y="-745.3" font-family="Times,serif" font-size="14.00" fill="#000000">medication_course_number</text>
<polyline fill="none" stroke="#000000" points="1011,-737.5 1292,-737.5 "/>
<text text-anchor="middle" x="1151.5" y="-722.3" font-family="Times,serif" font-size="14.00" fill="#000000">missed_dose_amount</text>
<polyline fill="none" stroke="#000000" points="1011,-714.5 1292,-714.5 "/>
<text text-anchor="middle" x="1151.5" y="-699.3" font-family="Times,serif" font-size="14.00" fill="#000000">medication_lot_number</text>
<polyline fill="none" stroke="#000000" points="1011,-691.5 1292,-691.5 "/>
<text text-anchor="middle" x="1151.5" y="-676.3" font-family="Times,serif" font-size="14.00" fill="#000000">medication_duration</text>
<polyline fill="none" stroke="#000000" points="1011,-668.5 1292,-668.5 "/>
<text text-anchor="middle" x="1151.5" y="-653.3" font-family="Times,serif" font-size="14.00" fill="#000000">medication_units_of_measure</text>
<polyline fill="none" stroke="#000000" points="1011,-645.5 1292,-645.5 "/>
<text text-anchor="middle" x="1151.5" y="-630.3" font-family="Times,serif" font-size="14.00" fill="#000000">medication_actual_dose</text>
<polyline fill="none" stroke="#000000" points="1292,-622.5 1292,-1105.5 "/>
<text text-anchor="middle" x="1302.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- agent_administration&#45;&gt;visit -->
<g id="edge33" class="edge">
<title>agent_administration&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M1187.3286,-622.2814C1200.1689,-609.6019 1214.2005,-598.289 1229.5,-589 1256.1838,-572.799 1664.666,-557.4941 1865.5832,-550.9006"/>
<polygon fill="#000000" stroke="#000000" points="1865.9915,-554.3893 1875.8719,-550.5646 1865.763,-547.393 1865.9915,-554.3893"/>
<text text-anchor="middle" x="1257.5" y="-592.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
<!-- agent -->
<g id="node27" class="node">
<title>agent</title>
<path fill="none" stroke="#000000" d="M953.5,-524.5C953.5,-524.5 1179.5,-524.5 1179.5,-524.5 1185.5,-524.5 1191.5,-530.5 1191.5,-536.5 1191.5,-536.5 1191.5,-558.5 1191.5,-558.5 1191.5,-564.5 1185.5,-570.5 1179.5,-570.5 1179.5,-570.5 953.5,-570.5 953.5,-570.5 947.5,-570.5 941.5,-564.5 941.5,-558.5 941.5,-558.5 941.5,-536.5 941.5,-536.5 941.5,-530.5 947.5,-524.5 953.5,-524.5"/>
<text text-anchor="middle" x="970" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000">agent</text>
<polyline fill="none" stroke="#000000" points="998.5,-524.5 998.5,-570.5 "/>
<text text-anchor="middle" x="1009" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1019.5,-524.5 1019.5,-570.5 "/>
<text text-anchor="middle" x="1095" y="-555.3" font-family="Times,serif" font-size="14.00" fill="#000000">medication</text>
<polyline fill="none" stroke="#000000" points="1019.5,-547.5 1170.5,-547.5 "/>
<text text-anchor="middle" x="1095" y="-532.3" font-family="Times,serif" font-size="14.00" fill="#000000">document_number</text>
<polyline fill="none" stroke="#000000" points="1170.5,-524.5 1170.5,-570.5 "/>
<text text-anchor="middle" x="1181" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- agent_administration&#45;&gt;agent -->
<g id="edge28" class="edge">
<title>agent_administration&#45;&gt;agent</title>
<path fill="none" stroke="#000000" d="M1066.5,-622.1053C1066.5,-606.5346 1066.5,-592.48 1066.5,-580.8773"/>
<polygon fill="#000000" stroke="#000000" points="1070.0001,-580.5348 1066.5,-570.5348 1063.0001,-580.5348 1070.0001,-580.5348"/>
<text text-anchor="middle" x="1097.5" y="-592.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_agent</text>
</g>
<!-- prior_therapy -->
<g id="node7" class="node">
<title>prior_therapy</title>
<path fill="none" stroke="#000000" d="M2017.5,-2052.5C2017.5,-2052.5 2473.5,-2052.5 2473.5,-2052.5 2479.5,-2052.5 2485.5,-2058.5 2485.5,-2064.5 2485.5,-2064.5 2485.5,-2638.5 2485.5,-2638.5 2485.5,-2644.5 2479.5,-2650.5 2473.5,-2650.5 2473.5,-2650.5 2017.5,-2650.5 2017.5,-2650.5 2011.5,-2650.5 2005.5,-2644.5 2005.5,-2638.5 2005.5,-2638.5 2005.5,-2064.5 2005.5,-2064.5 2005.5,-2058.5 2011.5,-2052.5 2017.5,-2052.5"/>
<text text-anchor="middle" x="2063" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000">prior_therapy</text>
<polyline fill="none" stroke="#000000" points="2120.5,-2052.5 2120.5,-2650.5 "/>
<text text-anchor="middle" x="2131" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2141.5,-2052.5 2141.5,-2650.5 "/>
<text text-anchor="middle" x="2303" y="-2635.3" font-family="Times,serif" font-size="14.00" fill="#000000">treatment_performed_in_minimal_residual</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2627.5 2464.5,-2627.5 "/>
<text text-anchor="middle" x="2303" y="-2612.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_first_dose</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2604.5 2464.5,-2604.5 "/>
<text text-anchor="middle" x="2303" y="-2589.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_last_dose</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2581.5 2464.5,-2581.5 "/>
<text text-anchor="middle" x="2303" y="-2566.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_last_dose_nsaid</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2558.5 2464.5,-2558.5 "/>
<text text-anchor="middle" x="2303" y="-2543.3" font-family="Times,serif" font-size="14.00" fill="#000000">tx_loc_geo_loc_ind_nsaid</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2535.5 2464.5,-2535.5 "/>
<text text-anchor="middle" x="2303" y="-2520.3" font-family="Times,serif" font-size="14.00" fill="#000000">number_of_prior_regimens_any_therapy</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2512.5 2464.5,-2512.5 "/>
<text text-anchor="middle" x="2303" y="-2497.3" font-family="Times,serif" font-size="14.00" fill="#000000">therapy_type</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2489.5 2464.5,-2489.5 "/>
<text text-anchor="middle" x="2303" y="-2474.3" font-family="Times,serif" font-size="14.00" fill="#000000">total_dose</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2466.5 2464.5,-2466.5 "/>
<text text-anchor="middle" x="2303" y="-2451.3" font-family="Times,serif" font-size="14.00" fill="#000000">number_of_prior_regimens_nsaid</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2443.5 2464.5,-2443.5 "/>
<text text-anchor="middle" x="2303" y="-2428.3" font-family="Times,serif" font-size="14.00" fill="#000000">total_number_of_doses_any_therapy</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2420.5 2464.5,-2420.5 "/>
<text text-anchor="middle" x="2303" y="-2405.3" font-family="Times,serif" font-size="14.00" fill="#000000">best_response</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2397.5 2464.5,-2397.5 "/>
<text text-anchor="middle" x="2303" y="-2382.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_last_dose_steroid</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2374.5 2464.5,-2374.5 "/>
<text text-anchor="middle" x="2303" y="-2359.3" font-family="Times,serif" font-size="14.00" fill="#000000">agent_units_of_measure</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2351.5 2464.5,-2351.5 "/>
<text text-anchor="middle" x="2303" y="-2336.3" font-family="Times,serif" font-size="14.00" fill="#000000">prior_therapy_type</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2328.5 2464.5,-2328.5 "/>
<text text-anchor="middle" x="2303" y="-2313.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_last_dose_any_therapy</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2305.5 2464.5,-2305.5 "/>
<text text-anchor="middle" x="2303" y="-2290.3" font-family="Times,serif" font-size="14.00" fill="#000000">treatment_performed_at_site</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2282.5 2464.5,-2282.5 "/>
<text text-anchor="middle" x="2303" y="-2267.3" font-family="Times,serif" font-size="14.00" fill="#000000">prior_steroid_exposure</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2259.5 2464.5,-2259.5 "/>
<text text-anchor="middle" x="2303" y="-2244.3" font-family="Times,serif" font-size="14.00" fill="#000000">min_rsdl_dz_tx_ind_nsaids_treatment_pe</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2236.5 2464.5,-2236.5 "/>
<text text-anchor="middle" x="2303" y="-2221.3" font-family="Times,serif" font-size="14.00" fill="#000000">prior_nsaid_exposure</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2213.5 2464.5,-2213.5 "/>
<text text-anchor="middle" x="2303" y="-2198.3" font-family="Times,serif" font-size="14.00" fill="#000000">any_therapy</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2190.5 2464.5,-2190.5 "/>
<text text-anchor="middle" x="2303" y="-2175.3" font-family="Times,serif" font-size="14.00" fill="#000000">total_number_of_doses_steroid</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2167.5 2464.5,-2167.5 "/>
<text text-anchor="middle" x="2303" y="-2152.3" font-family="Times,serif" font-size="14.00" fill="#000000">nonresponse_therapy_type</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2144.5 2464.5,-2144.5 "/>
<text text-anchor="middle" x="2303" y="-2129.3" font-family="Times,serif" font-size="14.00" fill="#000000">number_of_prior_regimens_steroid</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2121.5 2464.5,-2121.5 "/>
<text text-anchor="middle" x="2303" y="-2106.3" font-family="Times,serif" font-size="14.00" fill="#000000">dose_schedule</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2098.5 2464.5,-2098.5 "/>
<text text-anchor="middle" x="2303" y="-2083.3" font-family="Times,serif" font-size="14.00" fill="#000000">agent_name</text>
<polyline fill="none" stroke="#000000" points="2141.5,-2075.5 2464.5,-2075.5 "/>
<text text-anchor="middle" x="2303" y="-2060.3" font-family="Times,serif" font-size="14.00" fill="#000000">total_number_of_doses_nsaid</text>
<polyline fill="none" stroke="#000000" points="2464.5,-2052.5 2464.5,-2650.5 "/>
<text text-anchor="middle" x="2475" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- prior_therapy&#45;&gt;prior_therapy -->
<g id="edge25" class="edge">
<title>prior_therapy&#45;&gt;prior_therapy</title>
<path fill="none" stroke="#000000" d="M2485.7384,-2389.6912C2496.9387,-2380.0507 2503.5,-2367.3203 2503.5,-2351.5 2503.5,-2339.3876 2499.6539,-2329.0864 2492.8244,-2320.5965"/>
<polygon fill="#000000" stroke="#000000" points="2495.219,-2318.0385 2485.7384,-2313.3088 2490.2002,-2322.9183 2495.219,-2318.0385"/>
<text text-anchor="middle" x="2519.5" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000">next</text>
</g>
<!-- prior_therapy&#45;&gt;enrollment -->
<g id="edge30" class="edge">
<title>prior_therapy&#45;&gt;enrollment</title>
<path fill="none" stroke="#000000" d="M2245.5,-2052.213C2245.5,-1903.2622 2245.5,-1732.0225 2245.5,-1622.1556"/>
<polygon fill="#000000" stroke="#000000" points="2249.0001,-1622.0479 2245.5,-1612.0479 2242.0001,-1622.0479 2249.0001,-1622.0479"/>
<text text-anchor="middle" x="2295.5" y="-1880.3" font-family="Times,serif" font-size="14.00" fill="#000000">at_enrollment</text>
</g>
<!-- off_treatment -->
<g id="node8" class="node">
<title>off_treatment</title>
<path fill="none" stroke="#000000" d="M2748,-772C2748,-772 3195,-772 3195,-772 3201,-772 3207,-778 3207,-784 3207,-784 3207,-944 3207,-944 3207,-950 3201,-956 3195,-956 3195,-956 2748,-956 2748,-956 2742,-956 2736,-950 2736,-944 2736,-944 2736,-784 2736,-784 2736,-778 2742,-772 2748,-772"/>
<text text-anchor="middle" x="2793.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">off_treatment</text>
<polyline fill="none" stroke="#000000" points="2851,-772 2851,-956 "/>
<text text-anchor="middle" x="2861.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2872,-772 2872,-956 "/>
<text text-anchor="middle" x="3029" y="-940.8" font-family="Times,serif" font-size="14.00" fill="#000000">reason_off_treatment</text>
<polyline fill="none" stroke="#000000" points="2872,-933 3186,-933 "/>
<text text-anchor="middle" x="3029" y="-917.8" font-family="Times,serif" font-size="14.00" fill="#000000">best_resp_vet_tx_tp_best_response</text>
<polyline fill="none" stroke="#000000" points="2872,-910 3186,-910 "/>
<text text-anchor="middle" x="3029" y="-894.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_off_treatment</text>
<polyline fill="none" stroke="#000000" points="2872,-887 3186,-887 "/>
<text text-anchor="middle" x="3029" y="-871.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_disease_progression</text>
<polyline fill="none" stroke="#000000" points="2872,-864 3186,-864 "/>
<text text-anchor="middle" x="3029" y="-848.8" font-family="Times,serif" font-size="14.00" fill="#000000">document_number</text>
<polyline fill="none" stroke="#000000" points="2872,-841 3186,-841 "/>
<text text-anchor="middle" x="3029" y="-825.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_last_medication_administration</text>
<polyline fill="none" stroke="#000000" points="2872,-818 3186,-818 "/>
<text text-anchor="middle" x="3029" y="-802.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_best_response</text>
<polyline fill="none" stroke="#000000" points="2872,-795 3186,-795 "/>
<text text-anchor="middle" x="3029" y="-779.8" font-family="Times,serif" font-size="14.00" fill="#000000">best_resp_vet_tx_tp_secondary_response</text>
<polyline fill="none" stroke="#000000" points="3186,-772 3186,-956 "/>
<text text-anchor="middle" x="3196.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- sample -->
<g id="node9" class="node">
<title>sample</title>
<path fill="none" stroke="#000000" d="M3253,-1301.5C3253,-1301.5 3676,-1301.5 3676,-1301.5 3682,-1301.5 3688,-1307.5 3688,-1313.5 3688,-1313.5 3688,-1703.5 3688,-1703.5 3688,-1709.5 3682,-1715.5 3676,-1715.5 3676,-1715.5 3253,-1715.5 3253,-1715.5 3247,-1715.5 3241,-1709.5 3241,-1703.5 3241,-1703.5 3241,-1313.5 3241,-1313.5 3241,-1307.5 3247,-1301.5 3253,-1301.5"/>
<text text-anchor="middle" x="3275" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000">sample</text>
<polyline fill="none" stroke="#000000" points="3309,-1301.5 3309,-1715.5 "/>
<text text-anchor="middle" x="3319.5" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="3330,-1301.5 3330,-1715.5 "/>
<text text-anchor="middle" x="3498.5" y="-1700.3" font-family="Times,serif" font-size="14.00" fill="#000000">total_tissue_area</text>
<polyline fill="none" stroke="#000000" points="3330,-1692.5 3667,-1692.5 "/>
<text text-anchor="middle" x="3498.5" y="-1677.3" font-family="Times,serif" font-size="14.00" fill="#000000">general_sample_pathology</text>
<polyline fill="none" stroke="#000000" points="3330,-1669.5 3667,-1669.5 "/>
<text text-anchor="middle" x="3498.5" y="-1654.3" font-family="Times,serif" font-size="14.00" fill="#000000">comment</text>
<polyline fill="none" stroke="#000000" points="3330,-1646.5 3667,-1646.5 "/>
<text text-anchor="middle" x="3498.5" y="-1631.3" font-family="Times,serif" font-size="14.00" fill="#000000">tumor_tissue_area</text>
<polyline fill="none" stroke="#000000" points="3330,-1623.5 3667,-1623.5 "/>
<text text-anchor="middle" x="3498.5" y="-1608.3" font-family="Times,serif" font-size="14.00" fill="#000000">width_of_tumor</text>
<polyline fill="none" stroke="#000000" points="3330,-1600.5 3667,-1600.5 "/>
<text text-anchor="middle" x="3498.5" y="-1585.3" font-family="Times,serif" font-size="14.00" fill="#000000">percentage_tumor</text>
<polyline fill="none" stroke="#000000" points="3330,-1577.5 3667,-1577.5 "/>
<text text-anchor="middle" x="3498.5" y="-1562.3" font-family="Times,serif" font-size="14.00" fill="#000000">sample_id</text>
<polyline fill="none" stroke="#000000" points="3330,-1554.5 3667,-1554.5 "/>
<text text-anchor="middle" x="3498.5" y="-1539.3" font-family="Times,serif" font-size="14.00" fill="#000000">percentage_stroma</text>
<polyline fill="none" stroke="#000000" points="3330,-1531.5 3667,-1531.5 "/>
<text text-anchor="middle" x="3498.5" y="-1516.3" font-family="Times,serif" font-size="14.00" fill="#000000">analysis_area</text>
<polyline fill="none" stroke="#000000" points="3330,-1508.5 3667,-1508.5 "/>
<text text-anchor="middle" x="3498.5" y="-1493.3" font-family="Times,serif" font-size="14.00" fill="#000000">analysis_area_percentage_stroma</text>
<polyline fill="none" stroke="#000000" points="3330,-1485.5 3667,-1485.5 "/>
<text text-anchor="middle" x="3498.5" y="-1470.3" font-family="Times,serif" font-size="14.00" fill="#000000">necropsy_sample</text>
<polyline fill="none" stroke="#000000" points="3330,-1462.5 3667,-1462.5 "/>
<text text-anchor="middle" x="3498.5" y="-1447.3" font-family="Times,serif" font-size="14.00" fill="#000000">non_tumor_tissue_area</text>
<polyline fill="none" stroke="#000000" points="3330,-1439.5 3667,-1439.5 "/>
<text text-anchor="middle" x="3498.5" y="-1424.3" font-family="Times,serif" font-size="14.00" fill="#000000">analysis_area_percentage_glass</text>
<polyline fill="none" stroke="#000000" points="3330,-1416.5 3667,-1416.5 "/>
<text text-anchor="middle" x="3498.5" y="-1401.3" font-family="Times,serif" font-size="14.00" fill="#000000">sample_type</text>
<polyline fill="none" stroke="#000000" points="3330,-1393.5 3667,-1393.5 "/>
<text text-anchor="middle" x="3498.5" y="-1378.3" font-family="Times,serif" font-size="14.00" fill="#000000">length_of_tumor</text>
<polyline fill="none" stroke="#000000" points="3330,-1370.5 3667,-1370.5 "/>
<text text-anchor="middle" x="3498.5" y="-1355.3" font-family="Times,serif" font-size="14.00" fill="#000000">analysis_area_percentage_tumor</text>
<polyline fill="none" stroke="#000000" points="3330,-1347.5 3667,-1347.5 "/>
<text text-anchor="middle" x="3498.5" y="-1332.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_sample_collection</text>
<polyline fill="none" stroke="#000000" points="3330,-1324.5 3667,-1324.5 "/>
<text text-anchor="middle" x="3498.5" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000">analysis_area_percentage_pigmented_tumor</text>
<polyline fill="none" stroke="#000000" points="3667,-1301.5 3667,-1715.5 "/>
<text text-anchor="middle" x="3677.5" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- sample&#45;&gt;sample -->
<g id="edge24" class="edge">
<title>sample&#45;&gt;sample</title>
<path fill="none" stroke="#000000" d="M3688.0955,-1536.6646C3699.3572,-1529.6694 3706,-1520.2813 3706,-1508.5 3706,-1499.8481 3702.4175,-1492.4869 3696.0541,-1486.4162"/>
<polygon fill="#000000" stroke="#000000" points="3698.1666,-1483.6256 3688.0955,-1480.3354 3693.9167,-1489.1879 3698.1666,-1483.6256"/>
<text text-anchor="middle" x="3722" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000">next</text>
</g>
<!-- sample&#45;&gt;case -->
<g id="edge10" class="edge">
<title>sample&#45;&gt;case</title>
<path fill="none" stroke="#000000" d="M3240.8185,-1323.3439C3225.3019,-1314.9094 3209.4714,-1307.3417 3193.5,-1301 3048.3965,-1243.3842 2602.0246,-1217.7293 2377.4368,-1208.2243"/>
<polygon fill="#000000" stroke="#000000" points="2377.3782,-1204.7189 2367.2406,-1207.7974 2377.0854,-1211.7128 2377.3782,-1204.7189"/>
<text text-anchor="middle" x="3145.5" y="-1271.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_case</text>
</g>
<!-- sample&#45;&gt;visit -->
<g id="edge34" class="edge">
<title>sample&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M3378.2712,-1301.3153C3355.245,-1239.377 3332.3792,-1170.7155 3316.5,-1106 3288.8929,-993.4879 3335.2664,-666.8797 3249.5,-589 3228.074,-569.5442 2390.5095,-554.1675 2085.306,-549.2001"/>
<polygon fill="#000000" stroke="#000000" points="2085.1699,-545.6975 2075.1145,-549.0349 2085.0564,-552.6966 2085.1699,-545.6975"/>
<text text-anchor="middle" x="3351.5" y="-1127.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
<!-- lab_exam -->
<g id="node10" class="node">
<title>lab_exam</title>
<path fill="none" stroke="#000000" d="M1830.5,-846C1830.5,-846 1890.5,-846 1890.5,-846 1896.5,-846 1902.5,-852 1902.5,-858 1902.5,-858 1902.5,-870 1902.5,-870 1902.5,-876 1896.5,-882 1890.5,-882 1890.5,-882 1830.5,-882 1830.5,-882 1824.5,-882 1818.5,-876 1818.5,-870 1818.5,-870 1818.5,-858 1818.5,-858 1818.5,-852 1824.5,-846 1830.5,-846"/>
<text text-anchor="middle" x="1860.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">lab_exam</text>
</g>
<!-- lab_exam&#45;&gt;visit -->
<g id="edge36" class="edge">
<title>lab_exam&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M1861.2768,-845.6929C1863.6878,-803.913 1873.3803,-699.1885 1911.5,-622 1919.3782,-606.0474 1931.4667,-590.7223 1943.0244,-578.1634"/>
<polygon fill="#000000" stroke="#000000" points="1945.7499,-580.3765 1950.1098,-570.7203 1940.6798,-575.5501 1945.7499,-580.3765"/>
<text text-anchor="middle" x="1960.5" y="-592.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
<!-- program -->
<g id="node19" class="node">
<title>program</title>
<path fill="none" stroke="#000000" d="M261.5,-.5C261.5,-.5 569.5,-.5 569.5,-.5 575.5,-.5 581.5,-6.5 581.5,-12.5 581.5,-12.5 581.5,-126.5 581.5,-126.5 581.5,-132.5 575.5,-138.5 569.5,-138.5 569.5,-138.5 261.5,-138.5 261.5,-138.5 255.5,-138.5 249.5,-132.5 249.5,-126.5 249.5,-126.5 249.5,-12.5 249.5,-12.5 249.5,-6.5 255.5,-.5 261.5,-.5"/>
<text text-anchor="middle" x="288.5" y="-65.8" font-family="Times,serif" font-size="14.00" fill="#000000">program</text>
<polyline fill="none" stroke="#000000" points="327.5,-.5 327.5,-138.5 "/>
<text text-anchor="middle" x="338" y="-65.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="348.5,-.5 348.5,-138.5 "/>
<text text-anchor="middle" x="454.5" y="-123.3" font-family="Times,serif" font-size="14.00" fill="#000000">program_sort_order</text>
<polyline fill="none" stroke="#000000" points="348.5,-115.5 560.5,-115.5 "/>
<text text-anchor="middle" x="454.5" y="-100.3" font-family="Times,serif" font-size="14.00" fill="#000000">program_acronym</text>
<polyline fill="none" stroke="#000000" points="348.5,-92.5 560.5,-92.5 "/>
<text text-anchor="middle" x="454.5" y="-77.3" font-family="Times,serif" font-size="14.00" fill="#000000">program_short_description</text>
<polyline fill="none" stroke="#000000" points="348.5,-69.5 560.5,-69.5 "/>
<text text-anchor="middle" x="454.5" y="-54.3" font-family="Times,serif" font-size="14.00" fill="#000000">program_full_description</text>
<polyline fill="none" stroke="#000000" points="348.5,-46.5 560.5,-46.5 "/>
<text text-anchor="middle" x="454.5" y="-31.3" font-family="Times,serif" font-size="14.00" fill="#000000">program_name</text>
<polyline fill="none" stroke="#000000" points="348.5,-23.5 560.5,-23.5 "/>
<text text-anchor="middle" x="454.5" y="-8.3" font-family="Times,serif" font-size="14.00" fill="#000000">program_external_url</text>
<polyline fill="none" stroke="#000000" points="560.5,-.5 560.5,-138.5 "/>
<text text-anchor="middle" x="571" y="-65.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- study&#45;&gt;program -->
<g id="edge19" class="edge">
<title>study&#45;&gt;program</title>
<path fill="none" stroke="#000000" d="M415.5,-190.4932C415.5,-176.7786 415.5,-162.5421 415.5,-148.8576"/>
<polygon fill="#000000" stroke="#000000" points="419.0001,-148.5183 415.5,-138.5184 412.0001,-148.5184 419.0001,-148.5183"/>
<text text-anchor="middle" x="456" y="-160.8" font-family="Times,serif" font-size="14.00" fill="#000000">member_of</text>
</g>
<!-- prior_surgery -->
<g id="node12" class="node">
<title>prior_surgery</title>
<path fill="none" stroke="#000000" d="M2565.5,-2271C2565.5,-2271 2911.5,-2271 2911.5,-2271 2917.5,-2271 2923.5,-2277 2923.5,-2283 2923.5,-2283 2923.5,-2420 2923.5,-2420 2923.5,-2426 2917.5,-2432 2911.5,-2432 2911.5,-2432 2565.5,-2432 2565.5,-2432 2559.5,-2432 2553.5,-2426 2553.5,-2420 2553.5,-2420 2553.5,-2283 2553.5,-2283 2553.5,-2277 2559.5,-2271 2565.5,-2271"/>
<text text-anchor="middle" x="2611" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000">prior_surgery</text>
<polyline fill="none" stroke="#000000" points="2668.5,-2271 2668.5,-2432 "/>
<text text-anchor="middle" x="2679" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2689.5,-2271 2689.5,-2432 "/>
<text text-anchor="middle" x="2796" y="-2416.8" font-family="Times,serif" font-size="14.00" fill="#000000">therapeutic_indicator</text>
<polyline fill="none" stroke="#000000" points="2689.5,-2409 2902.5,-2409 "/>
<text text-anchor="middle" x="2796" y="-2393.8" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="2689.5,-2386 2902.5,-2386 "/>
<text text-anchor="middle" x="2796" y="-2370.8" font-family="Times,serif" font-size="14.00" fill="#000000">anatomical_site_of_surgery</text>
<polyline fill="none" stroke="#000000" points="2689.5,-2363 2902.5,-2363 "/>
<text text-anchor="middle" x="2796" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000">procedure</text>
<polyline fill="none" stroke="#000000" points="2689.5,-2340 2902.5,-2340 "/>
<text text-anchor="middle" x="2796" y="-2324.8" font-family="Times,serif" font-size="14.00" fill="#000000">surgical_finding</text>
<polyline fill="none" stroke="#000000" points="2689.5,-2317 2902.5,-2317 "/>
<text text-anchor="middle" x="2796" y="-2301.8" font-family="Times,serif" font-size="14.00" fill="#000000">residual_disease</text>
<polyline fill="none" stroke="#000000" points="2689.5,-2294 2902.5,-2294 "/>
<text text-anchor="middle" x="2796" y="-2278.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_surgery</text>
<polyline fill="none" stroke="#000000" points="2902.5,-2271 2902.5,-2432 "/>
<text text-anchor="middle" x="2913" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- prior_surgery&#45;&gt;prior_surgery -->
<g id="edge26" class="edge">
<title>prior_surgery&#45;&gt;prior_surgery</title>
<path fill="none" stroke="#000000" d="M2923.613,-2393.5585C2934.7907,-2383.5547 2941.5,-2369.5352 2941.5,-2351.5 2941.5,-2337.5509 2937.4865,-2326.004 2930.4962,-2316.8593"/>
<polygon fill="#000000" stroke="#000000" points="2932.9806,-2314.3911 2923.613,-2309.4415 2927.8494,-2319.1525 2932.9806,-2314.3911"/>
<text text-anchor="middle" x="2957.5" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000">next</text>
</g>
<!-- prior_surgery&#45;&gt;enrollment -->
<g id="edge31" class="edge">
<title>prior_surgery&#45;&gt;enrollment</title>
<path fill="none" stroke="#000000" d="M2691.2291,-2270.6696C2602.8117,-2119.4813 2412.2506,-1793.6333 2311.3237,-1621.0545"/>
<polygon fill="#000000" stroke="#000000" points="2314.2111,-1619.0587 2306.1415,-1612.1933 2308.1686,-1622.5925 2314.2111,-1619.0587"/>
<text text-anchor="middle" x="2601.5" y="-1880.3" font-family="Times,serif" font-size="14.00" fill="#000000">at_enrollment</text>
</g>
<!-- assay -->
<g id="node13" class="node">
<title>assay</title>
<path fill="none" stroke="#000000" d="M3361.5,-2333.5C3361.5,-2333.5 3393.5,-2333.5 3393.5,-2333.5 3399.5,-2333.5 3405.5,-2339.5 3405.5,-2345.5 3405.5,-2345.5 3405.5,-2357.5 3405.5,-2357.5 3405.5,-2363.5 3399.5,-2369.5 3393.5,-2369.5 3393.5,-2369.5 3361.5,-2369.5 3361.5,-2369.5 3355.5,-2369.5 3349.5,-2363.5 3349.5,-2357.5 3349.5,-2357.5 3349.5,-2345.5 3349.5,-2345.5 3349.5,-2339.5 3355.5,-2333.5 3361.5,-2333.5"/>
<text text-anchor="middle" x="3377.5" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000">assay</text>
</g>
<!-- assay&#45;&gt;sample -->
<g id="edge12" class="edge">
<title>assay&#45;&gt;sample</title>
<path fill="none" stroke="#000000" d="M3375.0997,-2333.3447C3365.7116,-2258.5418 3334.0779,-1967.1823 3377.5,-1734 3378.0311,-1731.1478 3378.597,-1728.2851 3379.1954,-1725.4147"/>
<polygon fill="#000000" stroke="#000000" points="3382.6177,-1726.148 3381.352,-1715.629 3375.7818,-1724.6414 3382.6177,-1726.148"/>
<text text-anchor="middle" x="3414" y="-1880.3" font-family="Times,serif" font-size="14.00" fill="#000000">of_sample</text>
</g>
<!-- image -->
<g id="node14" class="node">
<title>image</title>
<path fill="none" stroke="#000000" d="M3246.5,-2788C3246.5,-2788 3282.5,-2788 3282.5,-2788 3288.5,-2788 3294.5,-2794 3294.5,-2800 3294.5,-2800 3294.5,-2812 3294.5,-2812 3294.5,-2818 3288.5,-2824 3282.5,-2824 3282.5,-2824 3246.5,-2824 3246.5,-2824 3240.5,-2824 3234.5,-2818 3234.5,-2812 3234.5,-2812 3234.5,-2800 3234.5,-2800 3234.5,-2794 3240.5,-2788 3246.5,-2788"/>
<text text-anchor="middle" x="3264.5" y="-2802.3" font-family="Times,serif" font-size="14.00" fill="#000000">image</text>
</g>
<!-- image&#45;&gt;assay -->
<g id="edge15" class="edge">
<title>image&#45;&gt;assay</title>
<path fill="none" stroke="#000000" d="M3270.7243,-2787.6619C3278.0473,-2766.6448 3290.9369,-2731.3211 3304.5,-2702 3311.514,-2686.837 3312.4911,-2682.3766 3322.5,-2669 3329.278,-2659.9414 3335.5366,-2661.1668 3340.5,-2651 3385.1044,-2559.6336 3383.3455,-2434.6814 3379.8834,-2379.5669"/>
<polygon fill="#000000" stroke="#000000" points="3383.3691,-2379.238 3379.1815,-2369.5059 3376.3861,-2379.7252 3383.3691,-2379.238"/>
<text text-anchor="middle" x="3353" y="-2672.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_assay</text>
</g>
<!-- disease_extent -->
<g id="node15" class="node">
<title>disease_extent</title>
<path fill="none" stroke="#000000" d="M1932.5,-714.5C1932.5,-714.5 2248.5,-714.5 2248.5,-714.5 2254.5,-714.5 2260.5,-720.5 2260.5,-726.5 2260.5,-726.5 2260.5,-1001.5 2260.5,-1001.5 2260.5,-1007.5 2254.5,-1013.5 2248.5,-1013.5 2248.5,-1013.5 1932.5,-1013.5 1932.5,-1013.5 1926.5,-1013.5 1920.5,-1007.5 1920.5,-1001.5 1920.5,-1001.5 1920.5,-726.5 1920.5,-726.5 1920.5,-720.5 1926.5,-714.5 1932.5,-714.5"/>
<text text-anchor="middle" x="1982" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">disease_extent</text>
<polyline fill="none" stroke="#000000" points="2043.5,-714.5 2043.5,-1013.5 "/>
<text text-anchor="middle" x="2054" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2064.5,-714.5 2064.5,-1013.5 "/>
<text text-anchor="middle" x="2152" y="-998.3" font-family="Times,serif" font-size="14.00" fill="#000000">evaluation_number</text>
<polyline fill="none" stroke="#000000" points="2064.5,-990.5 2239.5,-990.5 "/>
<text text-anchor="middle" x="2152" y="-975.3" font-family="Times,serif" font-size="14.00" fill="#000000">lesion_site</text>
<polyline fill="none" stroke="#000000" points="2064.5,-967.5 2239.5,-967.5 "/>
<text text-anchor="middle" x="2152" y="-952.3" font-family="Times,serif" font-size="14.00" fill="#000000">measured_how</text>
<polyline fill="none" stroke="#000000" points="2064.5,-944.5 2239.5,-944.5 "/>
<text text-anchor="middle" x="2152" y="-929.3" font-family="Times,serif" font-size="14.00" fill="#000000">target_lesion</text>
<polyline fill="none" stroke="#000000" points="2064.5,-921.5 2239.5,-921.5 "/>
<text text-anchor="middle" x="2152" y="-906.3" font-family="Times,serif" font-size="14.00" fill="#000000">lesion_number</text>
<polyline fill="none" stroke="#000000" points="2064.5,-898.5 2239.5,-898.5 "/>
<text text-anchor="middle" x="2152" y="-883.3" font-family="Times,serif" font-size="14.00" fill="#000000">longest_measurement</text>
<polyline fill="none" stroke="#000000" points="2064.5,-875.5 2239.5,-875.5 "/>
<text text-anchor="middle" x="2152" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">previously_treated</text>
<polyline fill="none" stroke="#000000" points="2064.5,-852.5 2239.5,-852.5 "/>
<text text-anchor="middle" x="2152" y="-837.3" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="2064.5,-829.5 2239.5,-829.5 "/>
<text text-anchor="middle" x="2152" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000">evaluation_code</text>
<polyline fill="none" stroke="#000000" points="2064.5,-806.5 2239.5,-806.5 "/>
<text text-anchor="middle" x="2152" y="-791.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_evaluation</text>
<polyline fill="none" stroke="#000000" points="2064.5,-783.5 2239.5,-783.5 "/>
<text text-anchor="middle" x="2152" y="-768.3" font-family="Times,serif" font-size="14.00" fill="#000000">measurable_lesion</text>
<polyline fill="none" stroke="#000000" points="2064.5,-760.5 2239.5,-760.5 "/>
<text text-anchor="middle" x="2152" y="-745.3" font-family="Times,serif" font-size="14.00" fill="#000000">lesion_description</text>
<polyline fill="none" stroke="#000000" points="2064.5,-737.5 2239.5,-737.5 "/>
<text text-anchor="middle" x="2152" y="-722.3" font-family="Times,serif" font-size="14.00" fill="#000000">previously_irradiated</text>
<polyline fill="none" stroke="#000000" points="2239.5,-714.5 2239.5,-1013.5 "/>
<text text-anchor="middle" x="2250" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- disease_extent&#45;&gt;visit -->
<g id="edge38" class="edge">
<title>disease_extent&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M2038.6069,-714.3917C2024.066,-673.5843 2007.991,-629.4714 1992.5,-589 1991.3945,-586.1119 1990.2229,-583.1209 1989.0322,-580.1286"/>
<polygon fill="#000000" stroke="#000000" points="1992.2109,-578.6528 1985.2217,-570.6903 1985.7199,-581.2734 1992.2109,-578.6528"/>
<text text-anchor="middle" x="2026.5" y="-592.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
<!-- case&#45;&gt;off_study -->
<g id="edge11" class="edge">
<title>case&#45;&gt;off_study</title>
<path fill="none" stroke="#000000" d="M2279.884,-1157.3602C2314.4722,-1110.9463 2369.128,-1037.604 2415.1357,-975.8663"/>
<polygon fill="#000000" stroke="#000000" points="2418.1088,-977.734 2421.2778,-967.6242 2412.4959,-973.5512 2418.1088,-977.734"/>
<text text-anchor="middle" x="2355" y="-1127.8" font-family="Times,serif" font-size="14.00" fill="#000000">went_off_study</text>
</g>
<!-- case&#45;&gt;off_treatment -->
<g id="edge41" class="edge">
<title>case&#45;&gt;off_treatment</title>
<path fill="none" stroke="#000000" d="M2367.232,-1186.9285C2488.6087,-1168.9738 2665.4982,-1138.5075 2726.5,-1106 2791.4905,-1071.3669 2850.6604,-1014.0355 2894.5648,-963.8667"/>
<polygon fill="#000000" stroke="#000000" points="2897.3028,-966.0515 2901.2043,-956.2012 2892.0116,-961.4686 2897.3028,-966.0515"/>
<text text-anchor="middle" x="2752.5" y="-1127.8" font-family="Times,serif" font-size="14.00" fill="#000000">went_off_treatment</text>
</g>
<!-- case&#45;&gt;study -->
<g id="edge20" class="edge">
<title>case&#45;&gt;study</title>
<path fill="none" stroke="#000000" d="M2123.9566,-1201.744C1811.1389,-1196.6861 983.8286,-1179.7577 712.5,-1139 519.277,-1109.975 369.5,-1059.3908 369.5,-864 369.5,-864 369.5,-864 369.5,-438 369.5,-412.646 374.4891,-385.8791 381.1812,-361.3798"/>
<polygon fill="#000000" stroke="#000000" points="384.5501,-362.3285 383.9285,-351.7519 377.8188,-360.4077 384.5501,-362.3285"/>
<text text-anchor="middle" x="410" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000">member_of</text>
</g>
<!-- adverse_event -->
<g id="node21" class="node">
<title>adverse_event</title>
<path fill="none" stroke="#000000" d="M1343,-668.5C1343,-668.5 1738,-668.5 1738,-668.5 1744,-668.5 1750,-674.5 1750,-680.5 1750,-680.5 1750,-1047.5 1750,-1047.5 1750,-1053.5 1744,-1059.5 1738,-1059.5 1738,-1059.5 1343,-1059.5 1343,-1059.5 1337,-1059.5 1331,-1053.5 1331,-1047.5 1331,-1047.5 1331,-680.5 1331,-680.5 1331,-674.5 1337,-668.5 1343,-668.5"/>
<text text-anchor="middle" x="1391" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">adverse_event</text>
<polyline fill="none" stroke="#000000" points="1451,-668.5 1451,-1059.5 "/>
<text text-anchor="middle" x="1461.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1472,-668.5 1472,-1059.5 "/>
<text text-anchor="middle" x="1600.5" y="-1044.3" font-family="Times,serif" font-size="14.00" fill="#000000">unexpected_adverse_event</text>
<polyline fill="none" stroke="#000000" points="1472,-1036.5 1729,-1036.5 "/>
<text text-anchor="middle" x="1600.5" y="-1021.3" font-family="Times,serif" font-size="14.00" fill="#000000">adverse_event_grade_description</text>
<polyline fill="none" stroke="#000000" points="1472,-1013.5 1729,-1013.5 "/>
<text text-anchor="middle" x="1600.5" y="-998.3" font-family="Times,serif" font-size="14.00" fill="#000000">day_in_cycle</text>
<polyline fill="none" stroke="#000000" points="1472,-990.5 1729,-990.5 "/>
<text text-anchor="middle" x="1600.5" y="-975.3" font-family="Times,serif" font-size="14.00" fill="#000000">attribution_to_commercial</text>
<polyline fill="none" stroke="#000000" points="1472,-967.5 1729,-967.5 "/>
<text text-anchor="middle" x="1600.5" y="-952.3" font-family="Times,serif" font-size="14.00" fill="#000000">adverse_event_term</text>
<polyline fill="none" stroke="#000000" points="1472,-944.5 1729,-944.5 "/>
<text text-anchor="middle" x="1600.5" y="-929.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_resolved</text>
<polyline fill="none" stroke="#000000" points="1472,-921.5 1729,-921.5 "/>
<text text-anchor="middle" x="1600.5" y="-906.3" font-family="Times,serif" font-size="14.00" fill="#000000">attribution_to_research</text>
<polyline fill="none" stroke="#000000" points="1472,-898.5 1729,-898.5 "/>
<text text-anchor="middle" x="1600.5" y="-883.3" font-family="Times,serif" font-size="14.00" fill="#000000">ae_dose</text>
<polyline fill="none" stroke="#000000" points="1472,-875.5 1729,-875.5 "/>
<text text-anchor="middle" x="1600.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">dose_limiting_toxicity</text>
<polyline fill="none" stroke="#000000" points="1472,-852.5 1729,-852.5 "/>
<text text-anchor="middle" x="1600.5" y="-837.3" font-family="Times,serif" font-size="14.00" fill="#000000">ae_other</text>
<polyline fill="none" stroke="#000000" points="1472,-829.5 1729,-829.5 "/>
<text text-anchor="middle" x="1600.5" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000">adverse_event_grade</text>
<polyline fill="none" stroke="#000000" points="1472,-806.5 1729,-806.5 "/>
<text text-anchor="middle" x="1600.5" y="-791.3" font-family="Times,serif" font-size="14.00" fill="#000000">attribution_to_disease</text>
<polyline fill="none" stroke="#000000" points="1472,-783.5 1729,-783.5 "/>
<text text-anchor="middle" x="1600.5" y="-768.3" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="1472,-760.5 1729,-760.5 "/>
<text text-anchor="middle" x="1600.5" y="-745.3" font-family="Times,serif" font-size="14.00" fill="#000000">ae_agent_name</text>
<polyline fill="none" stroke="#000000" points="1472,-737.5 1729,-737.5 "/>
<text text-anchor="middle" x="1600.5" y="-722.3" font-family="Times,serif" font-size="14.00" fill="#000000">attribution_to_ind</text>
<polyline fill="none" stroke="#000000" points="1472,-714.5 1729,-714.5 "/>
<text text-anchor="middle" x="1600.5" y="-699.3" font-family="Times,serif" font-size="14.00" fill="#000000">attribution_to_other</text>
<polyline fill="none" stroke="#000000" points="1472,-691.5 1729,-691.5 "/>
<text text-anchor="middle" x="1600.5" y="-676.3" font-family="Times,serif" font-size="14.00" fill="#000000">adverse_event_description</text>
<polyline fill="none" stroke="#000000" points="1729,-668.5 1729,-1059.5 "/>
<text text-anchor="middle" x="1739.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- case&#45;&gt;adverse_event -->
<g id="edge22" class="edge">
<title>case&#45;&gt;adverse_event</title>
<path fill="none" stroke="#000000" d="M2123.7368,-1193.0671C2032.9987,-1181.4037 1908.2432,-1156.9442 1809.5,-1106 1787.322,-1094.5578 1765.5494,-1080.8391 1744.5903,-1065.8261"/>
<polygon fill="#000000" stroke="#000000" points="1746.4322,-1062.8377 1736.2878,-1059.7813 1742.3121,-1068.4968 1746.4322,-1062.8377"/>
<text text-anchor="middle" x="1945.5" y="-1127.8" font-family="Times,serif" font-size="14.00" fill="#000000">had_adverse_event</text>
</g>
<!-- cohort -->
<g id="node23" class="node">
<title>cohort</title>
<path fill="none" stroke="#000000" d="M486,-524.5C486,-524.5 719,-524.5 719,-524.5 725,-524.5 731,-530.5 731,-536.5 731,-536.5 731,-558.5 731,-558.5 731,-564.5 725,-570.5 719,-570.5 719,-570.5 486,-570.5 486,-570.5 480,-570.5 474,-564.5 474,-558.5 474,-558.5 474,-536.5 474,-536.5 474,-530.5 480,-524.5 486,-524.5"/>
<text text-anchor="middle" x="505.5" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000">cohort</text>
<polyline fill="none" stroke="#000000" points="537,-524.5 537,-570.5 "/>
<text text-anchor="middle" x="547.5" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="558,-524.5 558,-570.5 "/>
<text text-anchor="middle" x="634" y="-555.3" font-family="Times,serif" font-size="14.00" fill="#000000">cohort_description</text>
<polyline fill="none" stroke="#000000" points="558,-547.5 710,-547.5 "/>
<text text-anchor="middle" x="634" y="-532.3" font-family="Times,serif" font-size="14.00" fill="#000000">cohort_dose</text>
<polyline fill="none" stroke="#000000" points="710,-524.5 710,-570.5 "/>
<text text-anchor="middle" x="720.5" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- case&#45;&gt;cohort -->
<g id="edge16" class="edge">
<title>case&#45;&gt;cohort</title>
<path fill="none" stroke="#000000" d="M2123.9891,-1200.5454C1795.7395,-1192.2272 907.1293,-1167.3611 777.5,-1139 739.5252,-1130.6916 720.8017,-1136.3403 696.5,-1106 567.9144,-945.4629 586.7083,-674.3676 597.8811,-580.591"/>
<polygon fill="#000000" stroke="#000000" points="601.3682,-580.911 599.1301,-570.5552 594.4218,-580.0464 601.3682,-580.911"/>
<text text-anchor="middle" x="737" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">member_of</text>
</g>
<!-- study_arm -->
<g id="node17" class="node">
<title>study_arm</title>
<path fill="none" stroke="#000000" d="M527,-415C527,-415 896,-415 896,-415 902,-415 908,-421 908,-427 908,-427 908,-449 908,-449 908,-455 902,-461 896,-461 896,-461 527,-461 527,-461 521,-461 515,-455 515,-449 515,-449 515,-427 515,-427 515,-421 521,-415 527,-415"/>
<text text-anchor="middle" x="561" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">study_arm</text>
<polyline fill="none" stroke="#000000" points="607,-415 607,-461 "/>
<text text-anchor="middle" x="617.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="628,-415 628,-461 "/>
<text text-anchor="middle" x="757.5" y="-445.8" font-family="Times,serif" font-size="14.00" fill="#000000">arm</text>
<polyline fill="none" stroke="#000000" points="628,-438 887,-438 "/>
<text text-anchor="middle" x="757.5" y="-422.8" font-family="Times,serif" font-size="14.00" fill="#000000">ctep_treatment_assignment_code</text>
<polyline fill="none" stroke="#000000" points="887,-415 887,-461 "/>
<text text-anchor="middle" x="897.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- study_arm&#45;&gt;study -->
<g id="edge18" class="edge">
<title>study_arm&#45;&gt;study</title>
<path fill="none" stroke="#000000" d="M670.6532,-414.9547C643.3439,-399.5471 605.5434,-378.2204 567.3974,-356.6989"/>
<polygon fill="#000000" stroke="#000000" points="568.651,-353.3875 558.2217,-351.522 565.2113,-359.4842 568.651,-353.3875"/>
<text text-anchor="middle" x="657" y="-373.8" font-family="Times,serif" font-size="14.00" fill="#000000">member_of</text>
</g>
<!-- demographic -->
<g id="node18" class="node">
<title>demographic</title>
<path fill="none" stroke="#000000" d="M2462.5,-1428C2462.5,-1428 2798.5,-1428 2798.5,-1428 2804.5,-1428 2810.5,-1434 2810.5,-1440 2810.5,-1440 2810.5,-1577 2810.5,-1577 2810.5,-1583 2804.5,-1589 2798.5,-1589 2798.5,-1589 2462.5,-1589 2462.5,-1589 2456.5,-1589 2450.5,-1583 2450.5,-1577 2450.5,-1577 2450.5,-1440 2450.5,-1440 2450.5,-1434 2456.5,-1428 2462.5,-1428"/>
<text text-anchor="middle" x="2505.5" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000">demographic</text>
<polyline fill="none" stroke="#000000" points="2560.5,-1428 2560.5,-1589 "/>
<text text-anchor="middle" x="2571" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2581.5,-1428 2581.5,-1589 "/>
<text text-anchor="middle" x="2685.5" y="-1573.8" font-family="Times,serif" font-size="14.00" fill="#000000">patient_age_at_enrollment</text>
<polyline fill="none" stroke="#000000" points="2581.5,-1566 2789.5,-1566 "/>
<text text-anchor="middle" x="2685.5" y="-1550.8" font-family="Times,serif" font-size="14.00" fill="#000000">weight</text>
<polyline fill="none" stroke="#000000" points="2581.5,-1543 2789.5,-1543 "/>
<text text-anchor="middle" x="2685.5" y="-1527.8" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="2581.5,-1520 2789.5,-1520 "/>
<text text-anchor="middle" x="2685.5" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000">neutered_indicator</text>
<polyline fill="none" stroke="#000000" points="2581.5,-1497 2789.5,-1497 "/>
<text text-anchor="middle" x="2685.5" y="-1481.8" font-family="Times,serif" font-size="14.00" fill="#000000">breed</text>
<polyline fill="none" stroke="#000000" points="2581.5,-1474 2789.5,-1474 "/>
<text text-anchor="middle" x="2685.5" y="-1458.8" font-family="Times,serif" font-size="14.00" fill="#000000">sex</text>
<polyline fill="none" stroke="#000000" points="2581.5,-1451 2789.5,-1451 "/>
<text text-anchor="middle" x="2685.5" y="-1435.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_birth</text>
<polyline fill="none" stroke="#000000" points="2789.5,-1428 2789.5,-1589 "/>
<text text-anchor="middle" x="2800" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- demographic&#45;&gt;case -->
<g id="edge6" class="edge">
<title>demographic&#45;&gt;case</title>
<path fill="none" stroke="#000000" d="M2568.7669,-1427.9805C2534.1892,-1386.5078 2488.4544,-1337.1926 2440.5,-1301 2417.3261,-1283.5099 2390.5324,-1267.7475 2364.3687,-1254.2477"/>
<polygon fill="#000000" stroke="#000000" points="2365.6489,-1250.9725 2355.1476,-1249.5679 2362.4809,-1257.2146 2365.6489,-1250.9725"/>
<text text-anchor="middle" x="2438.5" y="-1271.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_case</text>
</g>
<!-- enrollment&#45;&gt;case -->
<g id="edge5" class="edge">
<title>enrollment&#45;&gt;case</title>
<path fill="none" stroke="#000000" d="M2245.5,-1404.8153C2245.5,-1356.3611 2245.5,-1300.5569 2245.5,-1260.0093"/>
<polygon fill="#000000" stroke="#000000" points="2249.0001,-1259.7821 2245.5,-1249.7821 2242.0001,-1259.7822 2249.0001,-1259.7821"/>
<text text-anchor="middle" x="2272.5" y="-1271.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_case</text>
</g>
<!-- adverse_event&#45;&gt;adverse_event -->
<g id="edge27" class="edge">
<title>adverse_event&#45;&gt;adverse_event</title>
<path fill="none" stroke="#000000" d="M1750.2046,-896.9793C1761.376,-888.8906 1768,-877.8975 1768,-864 1768,-853.7941 1764.4277,-845.1544 1758.1053,-838.0812"/>
<polygon fill="#000000" stroke="#000000" points="1759.9933,-835.0744 1750.2046,-831.0207 1755.3288,-840.2939 1759.9933,-835.0744"/>
<text text-anchor="middle" x="1784" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">next</text>
</g>
<!-- adverse_event&#45;&gt;visit -->
<g id="edge37" class="edge">
<title>adverse_event&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M1739.0645,-668.2117C1777.6736,-638.028 1819.5647,-609.9754 1862.5,-589 1873.2094,-583.7681 1884.7554,-578.8076 1896.2337,-574.2573"/>
<polygon fill="#000000" stroke="#000000" points="1897.7802,-577.4117 1905.8397,-570.5346 1895.2506,-570.8847 1897.7802,-577.4117"/>
<text text-anchor="middle" x="1890.5" y="-592.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
<!-- adverse_event&#45;&gt;agent -->
<g id="edge29" class="edge">
<title>adverse_event&#45;&gt;agent</title>
<path fill="none" stroke="#000000" d="M1393.7789,-668.4326C1362.5158,-637.6405 1327.3791,-609.3206 1289.5,-589 1273.1742,-580.2419 1238.7242,-572.3155 1201.6785,-565.7927"/>
<polygon fill="#000000" stroke="#000000" points="1202.1442,-562.3215 1191.696,-564.078 1200.9592,-569.2205 1202.1442,-562.3215"/>
<text text-anchor="middle" x="1338.5" y="-592.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_agent</text>
</g>
<!-- file -->
<g id="node22" class="node">
<title>file</title>
<path fill="none" stroke="#000000" d="M3325,-2702.5C3325,-2702.5 3510,-2702.5 3510,-2702.5 3516,-2702.5 3522,-2708.5 3522,-2714.5 3522,-2714.5 3522,-2897.5 3522,-2897.5 3522,-2903.5 3516,-2909.5 3510,-2909.5 3510,-2909.5 3325,-2909.5 3325,-2909.5 3319,-2909.5 3313,-2903.5 3313,-2897.5 3313,-2897.5 3313,-2714.5 3313,-2714.5 3313,-2708.5 3319,-2702.5 3325,-2702.5"/>
<text text-anchor="middle" x="3332.5" y="-2802.3" font-family="Times,serif" font-size="14.00" fill="#000000">file</text>
<polyline fill="none" stroke="#000000" points="3352,-2702.5 3352,-2909.5 "/>
<text text-anchor="middle" x="3362.5" y="-2802.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="3373,-2702.5 3373,-2909.5 "/>
<text text-anchor="middle" x="3437" y="-2894.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_type</text>
<polyline fill="none" stroke="#000000" points="3373,-2886.5 3501,-2886.5 "/>
<text text-anchor="middle" x="3437" y="-2871.3" font-family="Times,serif" font-size="14.00" fill="#000000">uuid</text>
<polyline fill="none" stroke="#000000" points="3373,-2863.5 3501,-2863.5 "/>
<text text-anchor="middle" x="3437" y="-2848.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_name</text>
<polyline fill="none" stroke="#000000" points="3373,-2840.5 3501,-2840.5 "/>
<text text-anchor="middle" x="3437" y="-2825.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_locations</text>
<polyline fill="none" stroke="#000000" points="3373,-2817.5 3501,-2817.5 "/>
<text text-anchor="middle" x="3437" y="-2802.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_status</text>
<polyline fill="none" stroke="#000000" points="3373,-2794.5 3501,-2794.5 "/>
<text text-anchor="middle" x="3437" y="-2779.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_format</text>
<polyline fill="none" stroke="#000000" points="3373,-2771.5 3501,-2771.5 "/>
<text text-anchor="middle" x="3437" y="-2756.3" font-family="Times,serif" font-size="14.00" fill="#000000">md5sum</text>
<polyline fill="none" stroke="#000000" points="3373,-2748.5 3501,-2748.5 "/>
<text text-anchor="middle" x="3437" y="-2733.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_description</text>
<polyline fill="none" stroke="#000000" points="3373,-2725.5 3501,-2725.5 "/>
<text text-anchor="middle" x="3437" y="-2710.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_size</text>
<polyline fill="none" stroke="#000000" points="3501,-2702.5 3501,-2909.5 "/>
<text text-anchor="middle" x="3511.5" y="-2802.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- file&#45;&gt;diagnosis -->
<g id="edge2" class="edge">
<title>file&#45;&gt;diagnosis</title>
<path fill="none" stroke="#000000" d="M3312.698,-2706.1692C3309.6657,-2704.6657 3306.5982,-2703.2709 3303.5,-2702 3169.0407,-2646.843 2098.3968,-2754.6274 1996.5,-2651 1841.4932,-2493.3607 1880.3482,-2217.6931 1926.8358,-2043.3255"/>
<polygon fill="#000000" stroke="#000000" points="1930.2485,-2044.113 1929.4793,-2033.5461 1923.491,-2042.2863 1930.2485,-2044.113"/>
<text text-anchor="middle" x="2149" y="-2672.8" font-family="Times,serif" font-size="14.00" fill="#000000">from_diagnosis</text>
</g>
<!-- file&#45;&gt;sample -->
<g id="edge13" class="edge">
<title>file&#45;&gt;sample</title>
<path fill="none" stroke="#000000" d="M3447.455,-2702.2055C3448.637,-2696.0769 3449.6697,-2689.9766 3450.5,-2684 3496.5973,-2352.1815 3489.3368,-1962.611 3478.1912,-1725.7624"/>
<polygon fill="#000000" stroke="#000000" points="3481.6815,-1725.4734 3477.7087,-1715.6516 3474.6895,-1725.8071 3481.6815,-1725.4734"/>
<text text-anchor="middle" x="3523" y="-2347.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_sample</text>
</g>
<!-- file&#45;&gt;assay -->
<g id="edge14" class="edge">
<title>file&#45;&gt;assay</title>
<path fill="none" stroke="#000000" d="M3392.3207,-2702.4149C3391.249,-2696.2053 3390.2938,-2690.0327 3389.5,-2684 3374.774,-2572.0917 3375.5373,-2437.2976 3376.7236,-2379.7571"/>
<polygon fill="#000000" stroke="#000000" points="3380.2257,-2379.6984 3376.9542,-2369.6213 3373.2275,-2379.5391 3380.2257,-2379.6984"/>
<text text-anchor="middle" x="3420" y="-2672.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_assay</text>
</g>
<!-- cohort&#45;&gt;study -->
<g id="edge21" class="edge">
<title>cohort&#45;&gt;study</title>
<path fill="none" stroke="#000000" d="M494.4776,-524.399C467.3836,-513.3434 441.2795,-497.0351 424.5,-473 402.3667,-441.2962 397.6132,-399.4801 399.3813,-362.1222"/>
<polygon fill="#000000" stroke="#000000" points="402.9013,-361.9179 400.0439,-351.7157 395.9154,-361.473 402.9013,-361.9179"/>
<text text-anchor="middle" x="465" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">member_of</text>
</g>
<!-- cohort&#45;&gt;study_arm -->
<g id="edge17" class="edge">
<title>cohort&#45;&gt;study_arm</title>
<path fill="none" stroke="#000000" d="M597.6454,-524.4636C596.5931,-513.5378 597.2906,-500.7703 603.5,-491 609.7386,-481.1838 618.3735,-473.1302 628.0669,-466.5371"/>
<polygon fill="#000000" stroke="#000000" points="630.1669,-469.3534 636.8243,-461.1114 626.4802,-463.4029 630.1669,-469.3534"/>
<text text-anchor="middle" x="644" y="-494.8" font-family="Times,serif" font-size="14.00" fill="#000000">member_of</text>
</g>
<!-- visit&#45;&gt;visit -->
<g id="edge23" class="edge">
<title>visit&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M2075.3627,-555.0146C2086.0961,-553.5674 2093,-551.0625 2093,-547.5 2093,-545.2178 2090.1666,-543.3696 2085.3082,-541.9555"/>
<polygon fill="#000000" stroke="#000000" points="2085.8522,-538.4953 2075.3627,-539.9854 2084.492,-545.3619 2085.8522,-538.4953"/>
<text text-anchor="middle" x="2109" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000">next</text>
</g>
<!-- cycle -->
<g id="node25" class="node">
<title>cycle</title>
<path fill="none" stroke="#000000" d="M938.5,-403.5C938.5,-403.5 1166.5,-403.5 1166.5,-403.5 1172.5,-403.5 1178.5,-409.5 1178.5,-415.5 1178.5,-415.5 1178.5,-460.5 1178.5,-460.5 1178.5,-466.5 1172.5,-472.5 1166.5,-472.5 1166.5,-472.5 938.5,-472.5 938.5,-472.5 932.5,-472.5 926.5,-466.5 926.5,-460.5 926.5,-460.5 926.5,-415.5 926.5,-415.5 926.5,-409.5 932.5,-403.5 938.5,-403.5"/>
<text text-anchor="middle" x="953.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">cycle</text>
<polyline fill="none" stroke="#000000" points="980.5,-403.5 980.5,-472.5 "/>
<text text-anchor="middle" x="991" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1001.5,-403.5 1001.5,-472.5 "/>
<text text-anchor="middle" x="1079.5" y="-457.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_cycle_end</text>
<polyline fill="none" stroke="#000000" points="1001.5,-449.5 1157.5,-449.5 "/>
<text text-anchor="middle" x="1079.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_cycle_start</text>
<polyline fill="none" stroke="#000000" points="1001.5,-426.5 1157.5,-426.5 "/>
<text text-anchor="middle" x="1079.5" y="-411.3" font-family="Times,serif" font-size="14.00" fill="#000000">cycle_number</text>
<polyline fill="none" stroke="#000000" points="1157.5,-403.5 1157.5,-472.5 "/>
<text text-anchor="middle" x="1168" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- visit&#45;&gt;cycle -->
<g id="edge1" class="edge">
<title>visit&#45;&gt;cycle</title>
<path fill="none" stroke="#000000" d="M1875.9254,-543.1808C1727.7395,-535.6223 1440.5058,-516.6211 1188.9035,-473.1609"/>
<polygon fill="#000000" stroke="#000000" points="1189.2916,-469.6758 1178.839,-471.4059 1188.0891,-476.5717 1189.2916,-469.6758"/>
<text text-anchor="middle" x="1432" y="-494.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_cycle</text>
</g>
<!-- cycle&#45;&gt;case -->
<g id="edge8" class="edge">
<title>cycle&#45;&gt;case</title>
<path fill="none" stroke="#000000" d="M974.715,-472.5453C917.3321,-502.7822 843.6969,-552.7528 810.5,-622 787.2525,-670.4933 773.7849,-1066.7056 810.5,-1106 854.6556,-1153.2575 1767.4425,-1187.8896 2113.7918,-1199.3746"/>
<polygon fill="#000000" stroke="#000000" points="2113.7621,-1202.8754 2123.8722,-1199.7076 2113.9933,-1195.8792 2113.7621,-1202.8754"/>
<text text-anchor="middle" x="857.5" y="-592.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_case</text>
</g>
<!-- principal_investigator -->
<g id="node26" class="node">
<title>principal_investigator</title>
<path fill="none" stroke="#000000" d="M1209,-403.5C1209,-403.5 1536,-403.5 1536,-403.5 1542,-403.5 1548,-409.5 1548,-415.5 1548,-415.5 1548,-460.5 1548,-460.5 1548,-466.5 1542,-472.5 1536,-472.5 1536,-472.5 1209,-472.5 1209,-472.5 1203,-472.5 1197,-466.5 1197,-460.5 1197,-460.5 1197,-415.5 1197,-415.5 1197,-409.5 1203,-403.5 1209,-403.5"/>
<text text-anchor="middle" x="1284" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">principal_investigator</text>
<polyline fill="none" stroke="#000000" points="1371,-403.5 1371,-472.5 "/>
<text text-anchor="middle" x="1381.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1392,-403.5 1392,-472.5 "/>
<text text-anchor="middle" x="1459.5" y="-457.3" font-family="Times,serif" font-size="14.00" fill="#000000">pi_last_name</text>
<polyline fill="none" stroke="#000000" points="1392,-449.5 1527,-449.5 "/>
<text text-anchor="middle" x="1459.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">pi_first_name</text>
<polyline fill="none" stroke="#000000" points="1392,-426.5 1527,-426.5 "/>
<text text-anchor="middle" x="1459.5" y="-411.3" font-family="Times,serif" font-size="14.00" fill="#000000">pi_middle_initial</text>
<polyline fill="none" stroke="#000000" points="1527,-403.5 1527,-472.5 "/>
<text text-anchor="middle" x="1537.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- principal_investigator&#45;&gt;study -->
<g id="edge4" class="edge">
<title>principal_investigator&#45;&gt;study</title>
<path fill="none" stroke="#000000" d="M1196.7461,-404.6718C1193.6403,-404.108 1190.5562,-403.5503 1187.5,-403 977.1688,-365.1252 734.1039,-324.0005 577.7837,-297.8934"/>
<polygon fill="#000000" stroke="#000000" points="578.0537,-294.3901 567.6138,-296.1957 576.901,-301.2946 578.0537,-294.3901"/>
<text text-anchor="middle" x="1114" y="-373.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_study</text>
</g>
<!-- agent&#45;&gt;study_arm -->
<g id="edge40" class="edge">
<title>agent&#45;&gt;study_arm</title>
<path fill="none" stroke="#000000" d="M991.6474,-524.4117C934.4166,-506.7588 855.4942,-482.4151 795.9988,-464.0637"/>
<polygon fill="#000000" stroke="#000000" points="796.8376,-460.6598 786.2502,-461.0567 794.7743,-467.3488 796.8376,-460.6598"/>
<text text-anchor="middle" x="980" y="-494.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_study_arm</text>
</g>
<!-- follow_up -->
<g id="node28" class="node">
<title>follow_up</title>
<path fill="none" stroke="#000000" d="M2840.5,-1405C2840.5,-1405 3172.5,-1405 3172.5,-1405 3178.5,-1405 3184.5,-1411 3184.5,-1417 3184.5,-1417 3184.5,-1600 3184.5,-1600 3184.5,-1606 3178.5,-1612 3172.5,-1612 3172.5,-1612 2840.5,-1612 2840.5,-1612 2834.5,-1612 2828.5,-1606 2828.5,-1600 2828.5,-1600 2828.5,-1417 2828.5,-1417 2828.5,-1411 2834.5,-1405 2840.5,-1405"/>
<text text-anchor="middle" x="2871" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000">follow_up</text>
<polyline fill="none" stroke="#000000" points="2913.5,-1405 2913.5,-1612 "/>
<text text-anchor="middle" x="2924" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2934.5,-1405 2934.5,-1612 "/>
<text text-anchor="middle" x="3049" y="-1596.8" font-family="Times,serif" font-size="14.00" fill="#000000">patient_status</text>
<polyline fill="none" stroke="#000000" points="2934.5,-1589 3163.5,-1589 "/>
<text text-anchor="middle" x="3049" y="-1573.8" font-family="Times,serif" font-size="14.00" fill="#000000">treatment_since_last_contact</text>
<polyline fill="none" stroke="#000000" points="2934.5,-1566 3163.5,-1566 "/>
<text text-anchor="middle" x="3049" y="-1550.8" font-family="Times,serif" font-size="14.00" fill="#000000">physical_exam_changes</text>
<polyline fill="none" stroke="#000000" points="2934.5,-1543 3163.5,-1543 "/>
<text text-anchor="middle" x="3049" y="-1527.8" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="2934.5,-1520 3163.5,-1520 "/>
<text text-anchor="middle" x="3049" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000">physical_exam_performed</text>
<polyline fill="none" stroke="#000000" points="2934.5,-1497 3163.5,-1497 "/>
<text text-anchor="middle" x="3049" y="-1481.8" font-family="Times,serif" font-size="14.00" fill="#000000">document_number</text>
<polyline fill="none" stroke="#000000" points="2934.5,-1474 3163.5,-1474 "/>
<text text-anchor="middle" x="3049" y="-1458.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_last_contact</text>
<polyline fill="none" stroke="#000000" points="2934.5,-1451 3163.5,-1451 "/>
<text text-anchor="middle" x="3049" y="-1435.8" font-family="Times,serif" font-size="14.00" fill="#000000">contact_type</text>
<polyline fill="none" stroke="#000000" points="2934.5,-1428 3163.5,-1428 "/>
<text text-anchor="middle" x="3049" y="-1412.8" font-family="Times,serif" font-size="14.00" fill="#000000">explain_unknown_status</text>
<polyline fill="none" stroke="#000000" points="3163.5,-1405 3163.5,-1612 "/>
<text text-anchor="middle" x="3174" y="-1504.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- follow_up&#45;&gt;case -->
<g id="edge9" class="edge">
<title>follow_up&#45;&gt;case</title>
<path fill="none" stroke="#000000" d="M2936.4047,-1404.8578C2905.0959,-1366.3559 2864.9678,-1326.0039 2819.5,-1301 2745.3305,-1260.2124 2522.5328,-1231.0625 2377.3231,-1215.7804"/>
<polygon fill="#000000" stroke="#000000" points="2377.3144,-1212.2606 2367.0052,-1214.7041 2376.588,-1219.2228 2377.3144,-1212.2606"/>
<text text-anchor="middle" x="2792.5" y="-1271.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_case</text>
</g>
</g>
</svg>
</div>
