import { expect } from 'chai'
import sinon from 'sinon'
import { publish, subscribe } from './filter'

context('Filter spec', () => {
  it('should only trigger related subscriptions', () => {
    let count_user = sinon.spy()
    subscribe([{ table: 'user' }], count_user)

    let look_up_user_by_username = sinon.spy()
    subscribe(
      [{ table: 'user', fields: ['username'] }],
      look_up_user_by_username,
    )

    let select_user_1_username = sinon.spy()
    subscribe(
      [{ table: 'user', id: 1, fields: ['username'] }],
      select_user_1_username,
    )

    let select_user_2_username = sinon.spy()
    subscribe(
      [{ table: 'user', id: 2, fields: ['username'] }],
      select_user_2_username,
    )

    let select_user_2_rank = sinon.spy()
    subscribe([{ table: 'user', id: 2, fields: ['rank'] }], select_user_2_rank)

    let select_post_by_timestamp = sinon.spy()
    subscribe([{ table: 'post' }], select_post_by_timestamp)

    let select_post_1 = sinon.spy()
    subscribe([{ table: 'post', id: 1 }], select_post_1)

    expect(count_user.callCount).to.equals(0)
    expect(look_up_user_by_username.callCount).to.equals(0)
    expect(select_user_1_username.callCount).to.equals(0)
    expect(select_user_2_username.callCount).to.equals(0)
    expect(select_user_2_rank.callCount).to.equals(0)
    expect(select_post_by_timestamp.callCount).to.equals(0)
    expect(select_post_1.callCount).to.equals(0)

    console.log('# insert user')
    publish([{ table: 'user' }])
    expect(count_user.callCount).to.equals(1)
    expect(look_up_user_by_username.callCount).to.equals(1)
    expect(select_user_1_username.callCount).to.equals(1)
    expect(select_user_2_username.callCount).to.equals(1)
    expect(select_user_2_rank.callCount).to.equals(1)
    expect(select_post_by_timestamp.callCount).to.equals(0)
    expect(select_post_1.callCount).to.equals(0)

    console.log('# update user[1].username')
    publish([{ table: 'user', id: 1, fields: ['username'] }])
    expect(count_user.callCount).to.equals(2)
    expect(look_up_user_by_username.callCount).to.equals(2)
    expect(select_user_1_username.callCount).to.equals(2)
    expect(select_user_2_username.callCount).to.equals(1)
    expect(select_user_2_rank.callCount).to.equals(1)
    expect(select_post_by_timestamp.callCount).to.equals(0)
    expect(select_post_1.callCount).to.equals(0)

    console.log('# update user[2].username')
    publish([{ table: 'user', id: 2, fields: ['username'] }])
    expect(count_user.callCount).to.equals(3)
    expect(look_up_user_by_username.callCount).to.equals(3)
    expect(select_user_1_username.callCount).to.equals(2)
    expect(select_user_2_username.callCount).to.equals(2)
    expect(select_user_2_rank.callCount).to.equals(1)
    expect(select_post_by_timestamp.callCount).to.equals(0)
    expect(select_post_1.callCount).to.equals(0)

    console.log('# update user[2].rank')
    publish([{ table: 'user', id: 2, fields: ['rank'] }])
    expect(count_user.callCount).to.equals(4)
    expect(look_up_user_by_username.callCount).to.equals(3)
    expect(select_user_1_username.callCount).to.equals(2)
    expect(select_user_2_username.callCount).to.equals(2)
    expect(select_user_2_rank.callCount).to.equals(2)
    expect(select_post_by_timestamp.callCount).to.equals(0)
    expect(select_post_1.callCount).to.equals(0)

    console.log('# update post 1')
    publish([{ table: 'post', id: 1 }])
    expect(count_user.callCount).to.equals(4)
    expect(look_up_user_by_username.callCount).to.equals(3)
    expect(select_user_1_username.callCount).to.equals(2)
    expect(select_user_2_username.callCount).to.equals(2)
    expect(select_user_2_rank.callCount).to.equals(2)
    expect(select_post_by_timestamp.callCount).to.equals(1)
    expect(select_post_1.callCount).to.equals(1)
  })
})
