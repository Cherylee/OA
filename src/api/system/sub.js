import request from '@/utils/request'

// 查询平台用户与子系统用户关联列表
export function listSub(query) {
  return request({
    url: '/system/sub/list',
    method: 'get',
    params: query
  })
}

// 查询平台用户与子系统用户关联详细
export function getSub(id) {
  return request({
    url: '/system/sub/' + id,
    method: 'get'
  })
}

// 新增平台用户与子系统用户关联
export function addSub(data) {
  return request({
    url: '/system/sub',
    method: 'post',
    data: data
  })
}

// 修改平台用户与子系统用户关联
export function updateSub(data) {
  return request({
    url: '/system/sub',
    method: 'put',
    data: data
  })
}

// 删除平台用户与子系统用户关联
export function delSub(id) {
  return request({
    url: '/system/sub/' + id,
    method: 'delete'
  })
}
