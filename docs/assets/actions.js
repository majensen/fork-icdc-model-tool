$( function () {
  var model = L.map('model', {
    crs: L.CRS.Simple,
    minZoom: -3,
    zoomSnap: 1,
    bounceAtZoomLimits: true,
  });
  let nb = setup_node_select(model)
  var bounds = [[-2914,3379],[4,-4]]
  var image = L.svgOverlay($("#graph").find('svg').get(0), bounds).addTo(model)
  model.fitBounds(bounds)
  // L.polygon(nb.adverse_event.rect,{color: 'lightblue'}).addTo(model)
  $("#node_select").find('option[value=case]').attr("selected",true)
  model.flyToBounds(nb.case.bounds)
})
function setup_node_select(model) {
  let nb = get_node_bounds();
  console.log(nb);
  Object.keys(nb).sort()
    .forEach( function (item) {
      $("#node_select")
	.append($('<option value="'+item+'">'+item+'</option>'))
    })
  $("#node_select")
    .change( function () {
      model.flyToBounds(nb[$("#node_select").get(0).value].bounds)
    })
  return nb
}
function get_node_bounds() {
  let ret={}
  let X=3383
  let Y=-2914
  $('svg').find('.node')
    .each( function () {
      let bb =this.getBBox()
      ret[$(this).find('title').text()]={ bounds:[ [Y-bb.y, bb.x], [Y-bb.y-bb.height,bb.x+bb.width] ],
					  rect: [ [Y-bb.y,bb.x], [Y-bb.y,bb.x+bb.width],
						  [Y-bb.y-bb.height,bb.x+bb.width],
						  [Y-bb.y-bb.height,bb.x] ] }
    })
  return ret
}

